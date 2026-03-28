import { pipeline } from '@huggingface/transformers';

export async function getEmbedding(text) {
  // Create a feature-extraction pipeline
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  const result = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data);
}
