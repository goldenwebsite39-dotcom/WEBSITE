'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

interface CSVRow {
  name?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: string;
  status?: string;
  categories?: string;
  description?: string;
  short_description?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: ValidationError[];
}

const REQUIRED_FIELDS = ['name', 'sku'];
const OPTIONAL_FIELDS = [
  'price',
  'regular_price',
  'sale_price',
  'stock_quantity',
  'status',
  'categories',
  'description',
  'short_description',
];

const HEADERS = [
  'name',
  'sku',
  'price',
  'regular_price',
  'sale_price',
  'stock_quantity',
  'status',
  'categories',
  'description',
  'short_description',
];

const generateTemplateCSV = () => {
  const headers = HEADERS.join(',');
  const exampleRow = [
    'Gaming Mouse',
    'GM-001',
    '79.99',
    '79.99',
    '',
    '50',
    'publish',
    'Accessories',
    'High precision gaming mouse',
    'RGB gaming mouse',
  ].join(',');
  return `${headers}\n${exampleRow}`;
};

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParsed(false);
    setPreview([]);
    setCsvData([]);
    setValidationErrors([]);
    setResult(null);

    // Parse CSV
    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        setCsvData(data);
        setPreview(data.slice(0, 5));
        setParsed(true);
        toast.success(`Parsed ${data.length} rows`);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file');
      },
    });
  }, []);

  const validateRow = (row: CSVRow, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!row[field as keyof CSVRow] || String(row[field as keyof CSVRow]).trim() === '') {
        errors.push({
          row: rowIndex + 1,
          field,
          message: `${field} is required`,
        });
      }
    }

    // Validate price format
    if (row.price) {
      const price = parseFloat(row.price);
      if (isNaN(price) || price < 0) {
        errors.push({
          row: rowIndex + 1,
          field: 'price',
          message: 'Invalid price format',
        });
      }
    }

    // Validate stock quantity
    if (row.stock_quantity) {
      const stock = parseInt(row.stock_quantity, 10);
      if (isNaN(stock) || stock < 0) {
        errors.push({
          row: rowIndex + 1,
          field: 'stock_quantity',
          message: 'Invalid stock quantity',
        });
      }
    }

    // Validate status
    if (row.status && !['publish', 'private', 'draft'].includes(row.status)) {
      errors.push({
        row: rowIndex + 1,
        field: 'status',
        message: 'Invalid status (must be publish, private, or draft)',
      });
    }

    return errors;
  };

  const validateData = useCallback(() => {
    const errors: ValidationError[] = [];
    csvData.forEach((row, index) => {
      const rowErrors = validateRow(row, index);
      errors.push(...rowErrors);
    });
    setValidationErrors(errors);
    return errors.length === 0;
  }, [csvData]);

  const handleValidate = () => {
    setValidating(true);
    const isValid = validateData();
    setValidating(false);
    if (isValid) {
      toast.success('Data validation passed');
    } else {
      toast.error(`Found ${validationErrors.length} validation errors`);
    }
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before uploading');
      return;
    }

    setUploading(true);
    const result: ImportResult = {
      total: csvData.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Import each product
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          const product: any = {
            name: row.name,
            sku: row.sku,
            status: row.status || 'publish',
          };

          if (row.price) product.price = row.price;
          if (row.regular_price) product.regular_price = row.regular_price;
          if (row.sale_price) product.sale_price = row.sale_price;
          if (row.stock_quantity) {
            product.stock_quantity = parseInt(row.stock_quantity, 10);
            product.manage_stock = true;
          }
          if (row.description) product.description = row.description;
          if (row.short_description) product.short_description = row.short_description;

          // Handle categories
          if (row.categories) {
            const categoryNames = row.categories.split(',').map((c) => c.trim());
            product.categories = categoryNames.map((name) => ({ name }));
          }

          await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/wp-json/wc/v3/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization:
                'Basic ' +
                btoa(
                  `${process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET}`
                ),
            },
            body: JSON.stringify(product),
          });

          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            field: 'all',
            message: error.message || 'Failed to create product',
          });
        }
      }

      setResult(result);
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} products`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} products`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setCsvData([]);
    setPreview([]);
    setParsed(false);
    setValidationErrors([]);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bulk Upload
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Import multiple products via CSV
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file with product data. Required columns: name, sku
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              file
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <FileSpreadsheet className="h-8 w-8" />
                  <span className="font-semibold">{file.name}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {csvData.length} rows parsed
                </p>
                <Button variant="outline" onClick={resetForm}>
                  Remove and upload different file
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="font-medium">Choose a CSV file or drag it here</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports standard e-commerce product imports
                  </p>
                </div>
                <Button variant="outline" as="label">
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </Button>
              </div>
            )}
          </div>

          {/* Template Download */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
              CSV Format
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Download the template to ensure proper formatting:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([generateTemplateCSV()], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'product-import-template.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsed && preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview (first 5 rows)</CardTitle>
            <CardDescription>
              Review your data before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {HEADERS.map((header) => (
                      <th key={header} className="text-left py-2 px-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b">
                      {HEADERS.map((header) => (
                        <td key={header} className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {row[header as keyof CSVRow] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.length > 5 && (
              <p className="mt-2 text-sm text-gray-500">
                ... and {csvData.length - 5} more rows
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation */}
      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle>Validation</CardTitle>
            <CardDescription>
              Check for errors before uploading
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validating ? (
              <div className="flex items-center gap-2 text-primary-600">
                <CheckCircle className="h-5 w-5" />
                Validating...
              </div>
            ) : validationErrors.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600 mb-3">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">{validationErrors.length} errors found</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {validationErrors.map((error, i) => (
                    <div
                      key={i}
                      className="flex gap-3 py-2 border-b last:border-0 text-sm"
                    >
                      <span className="font-mono text-gray-500">Row {error.row}</span>
                      <span className="font-medium text-red-600">{error.field}</span>
                      <span className="text-gray-600 dark:text-gray-400">{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>No validation errors</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-gray-500">Success</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Errors</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((error, i) => (
                    <div key={i} className="text-sm text-red-600">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleValidate} disabled={!parsed || validating}>
          Validate Data
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!parsed || validationErrors.length > 0 || uploading}
          isLoading={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Products
        </Button>
      </div>

      {/* Warnings */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Important Notes</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Existing products with the same SKU will be updated (not duplicated)</li>
              <li>Make sure your API credentials have write permissions</li>
              <li>Large imports may take time and rate limits may apply</li>
              <li>Always test with a small batch first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
