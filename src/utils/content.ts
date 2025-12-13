import config, { monolocale } from "$config";

/**
 * 从 content ID 中提取语言代码
 * 新结构: "my-post/zh-cn" → "zh-cn"
 * 嵌套结构: "category/my-post/zh-cn" → "zh-cn"
 */
export function extractLocaleFromId(id: string): string {
	return id.split("/").pop() || config.i18n.defaultLocale;
}

/**
 * 从 content ID 中提取文章路径（移除语言后缀）
 * 新结构: "my-post/zh-cn" → "my-post"
 * 嵌套结构: "category/my-post/zh-cn" → "category/my-post"
 * Monolocale: "my-post" → "my-post" (不变)
 */
export function extractPathFromId(id: string): string {
	if (monolocale) return id;
	return id.split("/").slice(0, -1).join("/");
}

/**
 * 检查 content 是否属于指定语言
 * @param id - Content ID
 * @param locale - 目标语言代码
 * @returns 是否属于该语言
 */
export function isContentForLocale(id: string, locale: string): boolean {
	if (monolocale) return true;
	return extractLocaleFromId(id) === locale;
}

/**
 * 为 getStaticPaths 生成路由参数
 * 新结构: "category/my-post/zh-cn" → { locale: undefined|"en", id: "category/my-post" }
 * @param id - Content ID
 * @returns 路由参数对象
 */
export function generatePathParams(id: string): { locale: string | undefined; id: string } {
	if (monolocale) {
		return { locale: undefined, id };
	}

	const locale = extractLocaleFromId(id);
	const path = extractPathFromId(id);

	return {
		locale: locale === config.i18n.defaultLocale ? undefined : locale,
		id: path
	};
}
