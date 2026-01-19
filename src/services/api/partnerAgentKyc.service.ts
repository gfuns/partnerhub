import apiService from '../ApiService';

const partnerAgentKycService = {
  async getStatus(agentId: number) {
    return apiService.get(`/agents/${agentId}/kyc/status`);
  },

  async getProfile(agentId: number) {
    return apiService.get(`/agents/${agentId}/kyc/profile`);
  },

  async updateProfile(agentId: number, data: Record<string, any>) {
    return apiService.put(`/agents/${agentId}/kyc/profile`, data);
  },

  async getDocuments(agentId: number) {
    return apiService.get(`/agents/${agentId}/kyc/documents`);
  },

  async uploadDocument(agentId: number, file: File, documentType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return apiService.post(`/agents/${agentId}/kyc/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async downloadDocument(agentId: number, documentId: number) {
    return apiService.get(`/agents/${agentId}/kyc/documents/${documentId}/download`);
  },

  async deleteDocument(agentId: number, documentId: number) {
    return apiService.delete(`/agents/${agentId}/kyc/documents/${documentId}`);
  },

  async submit(agentId: number) {
    return apiService.post(`/agents/${agentId}/kyc/submit`);
  },
};

export default partnerAgentKycService;
