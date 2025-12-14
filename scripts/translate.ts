#!/usr/bin/env tsx

import "dotenv/config";
import fs from "node:fs";
import { cancel, confirm, intro, isCancel, multiselect, outro, select, spinner } from "@clack/prompts";
import config from "../site.config";
import { findArticles, getArticlePath, getTargetArticlePath, type ContentType, targetExists } from "./lib/article-scanner";
import { createTranslator, getLanguageName } from "./lib/translator";

const CANCEL_MESSAGE = "Translation cancelled";

!(async () => {
	console.clear();
	intro("📝 AI Article Translation");

	// 检查环境变量
	if (!process.env.TRANSLATE_API_KEY) {
		console.error("\n❌ Error: TRANSLATE_API_KEY not found in .env");
		console.log("\nPlease add the following to your .env file:");
		console.log("  TRANSLATE_API_BASE_URL=https://api.openai.com/v1");
		console.log("  TRANSLATE_API_KEY=sk-...");
		console.log("  TRANSLATE_MODEL=gpt-4\n");
		process.exit(1);
	}

	// 1. 选择内容类型
	const collection = (await select({
		message: "Select content type",
		options: [
			{ label: "Note (文记)", value: "note" },
			{ label: "Jotting (随笔)", value: "jotting" },
			{ label: "Preface (序文)", value: "preface" }
		]
	})) as ContentType;

	if (isCancel(collection)) {
		cancel(CANCEL_MESSAGE);
		process.exit(0);
	}

	// 2. 发现文章
	const s = spinner();
	s.start("Scanning articles...");
	const articles = findArticles(collection);
	s.stop(`Found ${articles.size} articles`);

	if (articles.size === 0) {
		outro(`No articles found in ${collection}/`);
		process.exit(0);
	}

	// 3. 选择源文章
	const articleId = (await select({
		message: "Select article to translate",
		options: Array.from(articles.entries()).map(([id, article]) => ({
			label: `${id} (${Array.from(article.locales).join(", ")})`,
			value: id,
			hint: `${article.locales.size} language(s)`
		}))
	})) as string;

	if (isCancel(articleId)) {
		cancel(CANCEL_MESSAGE);
		process.exit(0);
	}

	const article = articles.get(articleId)!;

	// 4. 选择源语言
	const sourceLocale = (await select({
		message: "Select source language",
		options: Array.from(article.locales).map(locale => ({
			label: getLanguageName(locale),
			value: locale
		}))
	})) as string;

	if (isCancel(sourceLocale)) {
		cancel(CANCEL_MESSAGE);
		process.exit(0);
	}

	// 5. 选择目标语言（多选，排除已存在的语言）
	const allLocales = config.i18n.locales;
	const availableTargets = allLocales.filter(l => !article.locales.has(l));

	if (availableTargets.length === 0) {
		outro(`All languages already exist for "${articleId}"`);
		process.exit(0);
	}

	const targetLocales = (await multiselect({
		message: "Select target languages",
		options: availableTargets.map(locale => ({
			label: getLanguageName(locale),
			value: locale
		})),
		required: true
	})) as string[];

	if (isCancel(targetLocales) || targetLocales.length === 0) {
		cancel(CANCEL_MESSAGE);
		process.exit(0);
	}

	// 6. 确认翻译
	const sourceLang = getLanguageName(sourceLocale);
	const targetLangs = targetLocales.map(l => getLanguageName(l)).join(", ");

	const proceed = await confirm({
		message: `Translate "${articleId}" from ${sourceLang} to ${targetLangs}?`,
		initialValue: true
	});

	if (isCancel(proceed) || !proceed) {
		cancel(CANCEL_MESSAGE);
		process.exit(0);
	}

	// 7. 执行翻译
	console.log("\n🤖 Starting translation...\n");

	// 创建翻译器
	let translator: ReturnType<typeof createTranslator>;
	try {
		translator = createTranslator();
	} catch (error) {
		console.error("\n❌ Failed to create translator:", error);
		process.exit(1);
	}

	// 读取源文件
	const sourcePath = getArticlePath(article, sourceLocale);
	const sourceContent = fs.readFileSync(sourcePath, "utf-8");

	// 翻译统计
	const stats = {
		success: [] as string[],
		failed: [] as string[]
	};

	// 对每个目标语言进行翻译
	for (const targetLocale of targetLocales) {
		const targetLang = getLanguageName(targetLocale);
		console.log(`\n📖 Translating to ${targetLang}...`);

		try {
			// 检查目标文件是否已存在
			if (targetExists(article, targetLocale)) {
				console.log(`⚠️  Warning: ${targetLocale} version already exists, skipping...`);
				continue;
			}

			// 翻译文章
			const translatedContent = await translator.translateArticle(sourceContent, collection, articleId, sourceLocale, targetLocale);

			// 保存文件
			const targetPath = getTargetArticlePath(article, sourceLocale, targetLocale);
			fs.writeFileSync(targetPath, translatedContent, "utf-8");

			console.log(`✅ Translation saved: ${targetPath}`);
			stats.success.push(targetLocale);
		} catch (error) {
			console.error(`❌ Translation failed for ${targetLocale}:`, error);
			stats.failed.push(targetLocale);
		}
	}

	// 显示摘要
	console.log(`\n${"═".repeat(50)}`);
	console.log("📊 Translation Summary");
	console.log("═".repeat(50));
	console.log(`✅ Successful: ${stats.success.length}`);
	if (stats.success.length > 0) {
		for (const locale of stats.success) {
			console.log(`   - ${getLanguageName(locale)}`);
		}
	}

	if (stats.failed.length > 0) {
		console.log(`\n❌ Failed: ${stats.failed.length}`);
		for (const locale of stats.failed) {
			console.log(`   - ${getLanguageName(locale)}`);
		}
	}

	if (stats.success.length > 0) {
		console.log("\n💡 Next steps:");
		console.log("   1. Review the translated articles");
		console.log("   2. Run: pnpm dev");
		console.log("   3. Test the translations in the browser\n");
	}

	outro("🎉 Translation completed!");
})().catch(error => {
	console.error("\n💥 Fatal error:", error);
	process.exit(1);
});
