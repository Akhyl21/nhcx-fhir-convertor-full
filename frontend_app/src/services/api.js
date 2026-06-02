import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 120000
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    if (err.response?.status !== 404) toast.error(msg);
    return Promise.reject(err);
  }
);

export const convertAPI = {
  previewFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/convert/preview', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  convertFile: (file, useCase, options = {}) => {
    const form = new FormData();
    form.append('file', file);
    form.append('useCase', useCase);
    form.append('useLLM', options.useLLM ?? 'true');
    form.append('validateWithLLM', options.validateWithLLM ?? 'false');
    if (options.customMapping) form.append('customMapping', JSON.stringify(options.customMapping));
    return api.post('/convert/file', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  convertJSON: (data, useCase, fieldMapping = null) =>
    api.post('/convert/json', { data, useCase, fieldMapping }),

  convertHL7: (message, useCase) =>
    api.post('/convert/hl7', { message, useCase }),

  convertFreeText: (text, useCase) =>
    api.post('/convert/freetext', { text, useCase }),

  inferMapping: (headers, sampleRow) =>
    api.post('/convert/infer-mapping', { headers, sampleRow }),

  validateBundle: (bundle) =>
    api.post('/validate/fhir-bundle', { bundle }),
};

export const schemaAPI = {
  getMasterSchema: () => api.get('/schema/master'),
  getSnomed: () => api.get('/schema/snomed'),
  getUseCases: () => api.get('/schema/use-cases'),
};

export const llmAPI = {
  getStatus: () => api.get('/llm/status'),
  extract: (text, useCase) => api.post('/llm/extract', { text, useCase }),
  mapHeaders: (headers, sampleRow) => api.post('/llm/map-headers', { headers, sampleRow }),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
