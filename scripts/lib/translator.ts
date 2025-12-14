import OpenAI from "openai";
import matter from "gray-matter";
import config from "../../site.config";

// 语言名称映射
const LANGUAGE_NAMES: Record<string, string> = {
	en: "English",
	"zh-cn": "中文",
	ja: "日本語"
};

/**
 * 获取语言名称
 */
export function getLanguageName(locale: string): string {
	return LANGUAGE_NAMES[locale] || locale;
}

/**
 * 生成原文链接 URL
 */
function generateSourceUrl(collection: string, articleId: string, sourceLocale: string): string {
	// 如果源语言是默认语言，不添加 locale 前缀
	if (sourceLocale === config.i18n.defaultLocale) {
		return `/${collection}/${articleId}`;
	}
	// 其他语言需要添加 locale 前缀
	return `/${sourceLocale}/${collection}/${articleId}`;
}

/**
 * 生成 AI 翻译警告框
 */
export function generateWarningBox(collection: string, articleId: string, sourceLocale: string, targetLocale: string): string {
	const sourceUrl = generateSourceUrl(collection, articleId, sourceLocale);
	const warnings: Record<string, string> = {
		en: `> [!NOTE]\n> This article is AI-translated from the [${getLanguageName(sourceLocale)} version](${sourceUrl}). It may contain inaccuracies or hallucinations. Please refer to the original version for accuracy.\n\n`,
		"zh-cn": `> [!NOTE]\n> 此文章由 AI 从 [${getLanguageName(sourceLocale)}版本](${sourceUrl}) 自动翻译，可能存在不准确之处或信息幻觉。请参考原文以确保准确性。\n\n`,
		ja: `> [!NOTE]\n> この記事は [${getLanguageName(sourceLocale)}版](${sourceUrl}) から AI 翻訳されたものです。不正確な情報や幻覚が含まれる可能性があります。正確な情報は原文をご参照ください。\n\n`
	};

	return warnings[targetLocale] || warnings.en;
}

/**
 * 翻译器类
 */
export class Translator {
	private client: OpenAI;
	private model: string;

	constructor(apiKey: string, baseURL: string, model: string = "gpt-4") {
		this.client = new OpenAI({
			apiKey,
			baseURL
		});
		this.model = model;
	}

	/**
	 * 翻译短文本（用于 title 和 description）
	 */
	async translateText(text: string, targetLocale: string): Promise<string> {
		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{
						role: "system",
						content:
							"You are a professional translator. Translate accurately and naturally. Return only the translated text without any explanation."
					},
					{
						role: "user",
						content: `Translate to ${getLanguageName(targetLocale)} (${targetLocale}): ${text}`
					}
				],
				temperature: 0.3
			});

			return response.choices[0].message.content?.trim() || text;
		} catch (error) {
			console.error(`Translation error for text: ${text}`, error);
			return text; // 失败时返回原文
		}
	}

	/**
	 * 翻译 Markdown 内容
	 */
	async translateMarkdown(content: string, sourceLocale: string, targetLocale: string): Promise<string> {
		const systemPrompt = `You are a professional technical writer and translator. Your task is to translate markdown articles accurately while:
1. Preserving all markdown formatting (links, code blocks, lists, headings, tables, etc.)
2. Keeping code snippets unchanged
3. Maintaining technical accuracy
4. Using natural, fluent language in the target locale
5. Not translating URLs, file paths, or command-line examples
6. Preserving special markdown syntax like [!NOTE], [!WARNING], etc.
7. Return only the translated markdown without any explanation or prefix`;

		const userPrompt = `Translate the following markdown article from ${getLanguageName(sourceLocale)} to ${getLanguageName(targetLocale)}.

Important rules:
- Keep all markdown syntax intact
- Do NOT translate code blocks (\`\`\`), inline code (\`), URLs, file paths, or technical commands
- Translate headings, paragraphs, list items, and table content
- Maintain the same level of technical detail
- Use natural expressions in ${getLanguageName(targetLocale)}
- Preserve line breaks and spacing

Article to translate:

${content}`;

		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{
						role: "system",
						content: systemPrompt
					},
					{
						role: "user",
						content: userPrompt
					}
				],
				temperature: 0.3
			});

			const translated = response.choices[0].message.content?.trim();
			if (!translated) {
				throw new Error("Empty translation response");
			}

			return translated;
		} catch (error) {
			console.error("Translation error for markdown content:", error);
			throw error;
		}
	}

	/**
	 * 翻译整篇文章（包括 frontmatter）
	 */
	async translateArticle(
		sourceContent: string,
		collection: string,
		articleId: string,
		sourceLocale: string,
		targetLocale: string
	): Promise<string> {
		// 解析 frontmatter
		const { data, content } = matter(sourceContent);

		// 翻译 frontmatter 字段
		const translatedData = { ...data };

		if (data.title) {
			console.log(`  Translating title: ${data.title}`);
			translatedData.title = await this.translateText(data.title, targetLocale);
		}

		if (data.description) {
			console.log(`  Translating description: ${data.description}`);
			translatedData.description = await this.translateText(data.description, targetLocale);
		}

		// 翻译正文内容
		console.log(`  Translating content (${content.length} characters)...`);
		const translatedContent = await this.translateMarkdown(content, sourceLocale, targetLocale);

		// 添加警告框
		const warningBox = generateWarningBox(collection, articleId, sourceLocale, targetLocale);
		const finalContent = warningBox + translatedContent;

		// 生成新文件内容
		return matter.stringify(finalContent, translatedData);
	}
}

/**
 * 创建翻译器实例
 */
export function createTranslator(apiKey?: string, baseURL?: string, model?: string): Translator {
	const key = apiKey || process.env.TRANSLATE_API_KEY;
	const url = baseURL || process.env.TRANSLATE_API_BASE_URL || "https://api.openai.com/v1";
	const modelName = model || process.env.TRANSLATE_MODEL || "gpt-4";

	if (!key) {
		throw new Error("Translation API key not found. Please set TRANSLATE_API_KEY in .env or pass it as an argument.");
	}

	return new Translator(key, url, modelName);
}
