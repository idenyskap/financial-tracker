import api from './api';

export const transactionService = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  deleteBulk: (ids) => api.delete('/transactions/bulk', { data: ids }),
  search: (params) => api.get('/transactions/search', { params }),
  getStats: () => api.get('/transactions/stats'),
  exportCSV: (params) => api.get('/transactions/export/csv', {
    params,
    responseType: 'blob'
  }),
  exportExcel: (params) => api.get('/transactions/export/excel', {
    params,
    responseType: 'blob'
  }),
};
