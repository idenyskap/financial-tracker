import { useState } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { useThemedStyles } from '../../hooks/useThemedStyles';

function ImportCSV({ onImportComplete }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(getStyles);
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
                      <li>{t('import.formatList.5')}</li>
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
                        <span style={{ ...styles.statValue, color: styles.__success }}>
                          {importResult.successfulImports}
                        </span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>{t('import.failed')}</span>
                        <span style={{ ...styles.statValue, color: styles.__danger }}>
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

const getStyles = (theme) => ({
  __success: theme.success,
  __danger: theme.danger,
  importButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
    backgroundColor: theme.primarySoft,
    color: theme.primary,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  icon: {
    width: '18px',
    height: '18px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.overlay,
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radiusLg,
    boxShadow: theme.shadowLarge,
    width: '90%',
    maxWidth: '600px',
    maxHeight: '85vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: `1px solid ${theme.border}`,
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: theme.text,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    color: theme.textSecondary,
  },
  closeIcon: {
    width: '22px',
    height: '22px',
  },
  modalBody: {
    padding: '1.5rem',
    color: theme.text,
  },
  instructions: {
    backgroundColor: theme.backgroundSecondary,
    border: `1px solid ${theme.border}`,
    padding: '1rem 1.25rem',
    borderRadius: theme.radius,
    marginBottom: '1.5rem',
    color: theme.textSecondary,
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
    backgroundColor: theme.primarySoft,
    color: theme.primary,
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontWeight: 600,
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
    padding: '1.25rem',
    border: `2px dashed ${theme.inputBorder}`,
    borderRadius: theme.radius,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: theme.textSecondary,
  },
  modalFooter: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  importConfirmButton: {
    padding: '0.7rem 1.5rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelButton: {
    padding: '0.7rem 1.5rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontWeight: 600,
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
    fontSize: '0.8rem',
    color: theme.textSecondary,
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: theme.text,
  },
  errors: {
    backgroundColor: theme.dangerSoft,
    padding: '1rem',
    borderRadius: theme.radius,
    border: `1px solid ${theme.danger}33`,
  },
  errorList: {
    margin: '0.5rem 0',
    paddingLeft: '1.5rem',
    fontSize: '0.85rem',
    color: theme.danger,
  },
  errorItem: {
    marginBottom: '0.25rem',
  },
  doneButton: {
    padding: '0.7rem 1.5rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontWeight: 600,
  },
});

export default ImportCSV;
