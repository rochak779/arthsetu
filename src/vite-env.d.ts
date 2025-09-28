/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CHATBOT_WEBHOOK_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv & {
		readonly PROD: boolean;
		readonly DEV: boolean;
		readonly MODE: string;
	};
}
