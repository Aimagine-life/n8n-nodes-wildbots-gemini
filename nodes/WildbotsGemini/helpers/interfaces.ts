import type { IDataObject } from 'n8n-workflow';

export enum Modality {
	IMAGE = 'IMAGE',
	TEXT = 'TEXT',
}

export type GenerateContentGenerationConfig = {
	stopSequences?: string[];
	responseMimeType?: string;
	responseSchema?: IDataObject;
	responseJsonSchema?: IDataObject;
	responseModalities?: string[];
	candidateCount?: number;
	maxOutputTokens?: number;
	temperature?: number;
	topP?: number;
	topK?: number;
	seed?: number;
	presencePenalty?: number;
	frequencyPenalty?: number;
	responseLogprobs?: boolean;
	logprobs?: number;
	speechConfig?: IDataObject;
	thinkingConfig?: IDataObject;
	mediaResolution?: string;
};

export interface GenerateContentRequest extends IDataObject {
	contents: Content[];
	tools?: Tool[];
	toolConfig?: IDataObject;
	systemInstruction?: IDataObject;
	safetySettings?: IDataObject[];
	generationConfig?: GenerateContentGenerationConfig;
	cachedContent?: string;
}

export interface GenerateContentResponse {
	candidates: Array<{
		content: Content;
	}>;
}

export interface Content {
	parts: Part[];
	role: string;
}

export type Part =
	| { text: string }
	| {
			inlineData: {
				mimeType: string;
				data: string;
			};
	  }
	| {
			functionCall: {
				id?: string;
				name: string;
				args?: IDataObject;
			};
	  }
	| {
			functionResponse: {
				id?: string;
				name: string;
				response: IDataObject;
			};
	  }
	| {
			fileData?: {
				mimeType?: string;
				fileUri?: string;
			};
	  };

export interface ImagenResponse {
	predictions: Array<{
		bytesBase64Encoded: string;
		mimeType: string;
	}>;
}

export interface VeoResponse {
	name: string;
	done: boolean;
	error?: {
		message: string;
	};
	response: {
		generateVideoResponse: {
			generatedSamples: Array<{
				video: {
					uri: string;
				};
			}>;
		};
	};
}

export interface FileSearchOperation {
	name: string;
	done: boolean;
	error?: { message: string };
	response?: IDataObject;
}

export interface BuiltInTools {
	googleSearch?: boolean;
	googleMaps?: {
		latitude?: number | string;
		longitude?: number | string;
	};
	urlContext?: boolean;
	fileSearch?: {
		fileSearchStoreNames?: string;
		metadataFilter?: string;
	};
	codeExecution?: boolean;
}

export interface Tool {
	functionDeclarations?: Array<{
		name: string;
		description: string;
		parameters: IDataObject;
	}>;
	googleSearch?: object;
	googleMaps?: object;
	urlContext?: object;
	fileSearch?: {
		fileSearchStoreNames?: string[];
		metadataFilter?: string;
	};
	codeExecution?: object;
}
