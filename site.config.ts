import siteConfig from "./src/utils/config";

const config = siteConfig({
	title: "Noctyl's Blog",
	prologue: "Font-end Developer | Tech Enthusiast | Content Creator",
	author: {
		name: "Noctyl",
		email: "Noctylx@outlook.com",
		link: "https://github.com/noctylx"
	},
	description: "A personal blog sharing insights on front-end development and technology.",
	copyright: {
		type: "CC BY-NC-ND 4.0",
		year: "2025"
	},
	i18n: {
		locales: ["en", "zh-cn", "ja"],
		defaultLocale: "zh-cn"
	},
	feed: {
		section: "*",
		limit: 20
	},
	latest: "*"
});

export const monolocale = Number(config.i18n.locales.length) === 1;

export default config;
