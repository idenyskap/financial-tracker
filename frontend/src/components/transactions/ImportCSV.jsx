import { useState } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';

function ImportCSV({ onImportComplete }) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const validExtensions = ['.csv', '.xls', '.xlsx'];
      const fileName = selectedFile.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

      if (validTypes.includes(selectedFile.type) || hasValidExtension) {
        setFile(selectedFile);
      } else {
        toast.error(t('import.selectValidFile') || 'Please select a CSV or Excel file (.csv, .xls, .xlsx)');
        e.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t('import.selectFile'));
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/transactions/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);

      if (response.data.successfulImports > 0) {
        toast.success(t('import.successfullyImported', { count: response.data.successfulImports }));
        onImportComplete();
      }

      if (response.data.failedImports > 0) {
        toast.warning(t('import.failedToImport', { count: response.data.failedImports }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('import.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setFile(null);
    setImportResult(null);
  };

  const downloadTemplate = () => {
    const template = 'date,amount,type,category,description\n' +
      '2025-01-15,50.00,EXPENSE,Food & Groceries,Supermarket shopping\n' +
      '2025-01-14,2500.00,INCOME,Salary,Monthly salary\n' +
      '2025-01-13,35.50,EXPENSE,Transport,Uber ride';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={styles.importButton}
      >
        <ArrowUpTrayIcon style={styles.icon} />
        {t('import.importCSV')}
      </button>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{t('import.modalTitle')}</h2>
              <button onClick={handleClose} style={styles.closeButton}>
                <XMarkIcon style={styles.closeIcon} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {!importResult ? (
                <>
                  <div style={styles.instructions}>
                    <h3>{t('import.formatRequirements')}</h3>
                    <ul style={styles.list}>
                      <li>{t('import.formatList.0')}</li>
                      <li>{t('import.formatList.1')}</li>
                      <li>{t('import.formatList.2')}</li>
                      <li>{t('import.formatList.3')}</li>
                      <li>{t('import.formatList.4')}</li>
                    </ul>
                    <button onClick={downloadTemplate} style={styles.templateButton}>
                      <DocumentTextIcon style={styles.smallIcon} />
                      {t('import.downloadTemplate')}
                    </button>
                  </div>

                  <div style={styles.fileUpload}>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileChange}
                      style={styles.fileInput}
                      id="csv-file"
                    />
                    <label htmlFor="csv-file" style={styles.fileLabel}>
                      {file ? file.name : (t('import.chooseFile') || 'Choose CSV or Excel file')}
                    </label>
                  </div>

                  <div style={styles.modalFooter}>
                    <button
                      onClick={handleImport}
                      disabled={!file || importing}
                      style={styles.importConfirmButton}
                    >
                      {importing ? t('import.importing') : t('import.import')}
                    </button>
                    <button onClick={handleClose} style={styles.cancelButton}>
                      {t('import.cancel')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.results}>
                    <h3>{t('import.results')}</h3>
                    <div style={styles.resultStats}>
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>{t('import.totalRows')}</span>
                        <span style={styles.statValue}>{importResult.totalRows}</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>{t('import.successful')}</span>
                        <span style={{ ...styles.statValue, color: '#27ae60' }}>
                          {importResult.successfulImports}
                        </span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>{t('import.failed')}</span>
                        <span style={{ ...styles.statValue, color: '#e74c3c' }}>
                          {importResult.failedImports}
                        </span>
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div style={styles.errors}>
                        <h4>{t('import.errors')}</h4>
                        <ul style={styles.errorList}>
                          {importResult.errors.map((error, index) => (
                            <li key={index} style={styles.errorItem}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div style={styles.modalFooter}>
                    <button onClick={handleClose} style={styles.doneButton}>
                      {t('import.done')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  importButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  icon: {
    width: '20px',
    height: '20px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #eee',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  closeIcon: {
    width: '24px',
    height: '24px',
  },
  modalBody: {
    padding: '1.5rem',
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1.5rem',
  },
  list: {
    margin: '0.5rem 0',
    paddingLeft: '1.5rem',
  },
  templateButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  smallIcon: {
    width: '16px',
    height: '16px',
  },
  fileUpload: {
    marginBottom: '1.5rem',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    display: 'block',
    padding: '1rem',
    border: '2px dashed #ddd',
    borderRadius: '4px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalFooter: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  importConfirmButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  results: {
    marginBottom: '1.5rem',
  },
  resultStats: {
    display: 'flex',
    gap: '2rem',
    marginTop: '1rem',
    marginBottom: '1.5rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#666',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  errors: {
    backgroundColor: '#fff5f5',
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #ffdddd',
  },
  errorList: {
    margin: '0.5rem 0',
    paddingLeft: '1.5rem',
    fontSize: '0.875rem',
    color: '#e74c3c',
  },
  errorItem: {
    marginBottom: '0.25rem',
  },
  doneButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ImportCSV;
