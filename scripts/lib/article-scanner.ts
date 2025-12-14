import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "../../src/content");

export type ContentType = "note" | "jotting" | "preface";

export interface Article {
	id: string;
	type: ContentType;
	locales: Set<string>;
	hasSubdirectory: Map<string, boolean>; // locale -> hasSubdir (for locale/index.md structure)
}

/**
 * 扫描指定类型的内容目录，查找所有文章及其语言版本
 */
export function findArticles(collection: ContentType): Map<string, Article> {
	const articles = new Map<string, Article>();
	const dir = path.join(CONTENT_DIR, collection);

	// 检查目录是否存在
	if (!fs.existsSync(dir)) {
		console.warn(`Directory not found: ${dir}`);
		return articles;
	}

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const articleId = entry.name;
		const articleDir = path.join(dir, articleId);
		const locales = new Set<string>();
		const hasSubdirectory = new Map<string, boolean>();

		// 查找该文章的所有语言版本
		const files = fs.readdirSync(articleDir);

		for (const file of files) {
			const filePath = path.join(articleDir, file);
			const stat = fs.statSync(filePath);

			if (stat.isFile() && (file.endsWith(".md") || file.endsWith(".mdx"))) {
				// 平面结构: article/locale.md
				const locale = path.basename(file, path.extname(file));
				locales.add(locale);
				hasSubdirectory.set(locale, false);
			} else if (stat.isDirectory()) {
				// 文件夹结构: article/locale/index.md
				const indexPath = path.join(filePath, "index.md");
				if (fs.existsSync(indexPath)) {
					locales.add(file); // file 就是 locale 名称
					hasSubdirectory.set(file, true);
				}
			}
		}

		if (locales.size > 0) {
			articles.set(articleId, {
				id: articleId,
				type: collection,
				locales,
				hasSubdirectory
			});
		}
	}

	return articles;
}

/**
 * 获取文章文件的完整路径
 */
export function getArticlePath(article: Article, locale: string): string {
	const baseDir = path.join(CONTENT_DIR, article.type, article.id);

	if (article.hasSubdirectory.get(locale)) {
		// 文件夹结构: article/locale/index.md
		return path.join(baseDir, locale, "index.md");
	}

	// 平面结构: article/locale.md (或 .mdx)
	const mdPath = path.join(baseDir, `${locale}.md`);
	const mdxPath = path.join(baseDir, `${locale}.mdx`);

	if (fs.existsSync(mdPath)) return mdPath;
	if (fs.existsSync(mdxPath)) return mdxPath;

	throw new Error(`Article file not found: ${article.id} (${locale})`);
}

/**
 * 生成目标语言文件路径
 */
export function getTargetArticlePath(article: Article, sourceLocale: string, targetLocale: string): string {
	const baseDir = path.join(CONTENT_DIR, article.type, article.id);

	// 与源文件使用相同的结构
	if (article.hasSubdirectory.get(sourceLocale)) {
		// 文件夹结构: article/locale/index.md
		const targetDir = path.join(baseDir, targetLocale);
		fs.mkdirSync(targetDir, { recursive: true });
		return path.join(targetDir, "index.md");
	}

	// 平面结构: article/locale.md
	return path.join(baseDir, `${targetLocale}.md`);
}

/**
 * 检查目标文件是否已存在
 */
export function targetExists(article: Article, targetLocale: string): boolean {
	return article.locales.has(targetLocale);
}
