"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceGenerator() {
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    client: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    items: [
      { id: 1, description: '', quantity: 1, price: 0, tax: 0 }
    ]
  });

  const [savedInvoices, setSavedInvoices] = useState([]);

  // Load saved invoices from localStorage
  useEffect(() => {
  const saved = localStorage.getItem('mastical-invoices');
  if (saved) {
    setSavedInvoices(JSON.parse(saved));
  }

  // Generate invoice number with 8-digit random number
  const randomPart = Math.floor(10000000 + Math.random() * 90000000); 
  // always 8 digits

  const invoiceId = `INV-${randomPart}`;

  setInvoice(prev => ({
    ...prev,
    invoiceNumber: invoiceId
  }));
  }, []);


  const addItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      price: 0,
      tax: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id, field, value) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateClient = (field, value) => {
    setInvoice(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.price;
    const taxAmount = subtotal * (item.tax / 100);
    return subtotal + taxAmount;
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalTax = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price * item.tax / 100), 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const saveInvoice = () => {
    const invoiceToSave = {
      ...invoice,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    const updated = [...savedInvoices, invoiceToSave];
    setSavedInvoices(updated);
    localStorage.setItem('mastical-invoices', JSON.stringify(updated));
    localStorage.setItem('mastical-last-invoice-number', invoice.invoiceNumber.split('-')[1]);
    
    alert('Invoice saved successfully!');
  };

  const generatePDF = async () => {
    const element = document.getElementById('invoice-preview');
    // Remove fixed width/height, let html2canvas use actual element size
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Convert canvas size from px to mm (1px = 0.264583 mm)
    const imgWidthMm = canvas.width * 0.264583;
    const imgHeightMm = canvas.height * 0.264583;

    // Center image and scale to fit A4
  let renderWidth = imgWidthMm;
  let renderHeight = imgHeightMm;
  let x = (pdfWidth - renderWidth) / 2;
  let y = 0; // Always start at the top of the page
  const widthRatio = pdfWidth / imgWidthMm;
  const heightRatio = pdfHeight / imgHeightMm;
  const ratio = Math.min(widthRatio, heightRatio, 1);
  renderWidth = imgWidthMm * ratio;
  renderHeight = imgHeightMm * ratio;
  x = (pdfWidth - renderWidth) / 2;
  // y = 0; // Remove vertical centering

  pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
    pdf.save(`${invoice.invoiceNumber}.pdf`);

    // Auto refresh and increment invoice number after PDF download
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const { subtotal, totalTax, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoice Generator</h1>
          <p className="text-gray-600">Create professional invoices for Mastical</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoice.invoiceNumber}
                      onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      value={invoice.client.name}
                      onChange={(e) => updateClient('name', e.target.value)}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={invoice.client.email}
                      onChange={(e) => updateClient('email', e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={invoice.client.phone}
                      onChange={(e) => updateClient('phone', e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientAddress">Address</Label>
                    <Textarea
                      id="clientAddress"
                      value={invoice.client.address}
                      onChange={(e) => updateClient('address', e.target.value)}
                      placeholder="Enter client address"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Items/Services
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.items.map((item) => (
                  <div key={item.id} className="space-y-3 p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Item {invoice.items.indexOf(item) + 1}</h4>
                      {invoice.items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Describe the item or service"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Price (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price === 0 ? '' : item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Tax (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      Item Total: ₹{calculateItemTotal(item).toFixed(2)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={generatePDF} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-8">
            <div id="invoice-preview" className="bg-white p-8 rounded-lg shadow-lg min-h-[800px] w-full max-w-none" style={{ fontSize: '14px', lineHeight: '1.5', maxWidth: '210mm', margin: '0 auto' }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <img 
                    src="/mastical-logo.png" 
                    alt="Mastical Logo" 
                    className="h-12 mb-4"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-xl text-gray-900">Mastical</p>
                    <p className="text-gray-700">+91 89994 53635</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">INVOICE</h1>
                  <div className="space-y-1">
                    <p><span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}</p>
                    <p><span className="font-semibold">Date:</span> {format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                    <p><span className="font-semibold">Due Date:</span> {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Client Info */}
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-3">Bill To:</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{invoice.client.name || 'Client Name'}</p>
                  <p className="text-gray-700">{invoice.client.email}</p>
                  <p className="text-gray-700">{invoice.client.phone}</p>
                  <p className="whitespace-pre-line text-gray-700">{invoice.client.address}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 font-bold">Description</th>
                      <th className="text-center py-3 font-bold w-16">Qty</th>
                      <th className="text-right py-3 font-bold w-24">Price</th>
                      <th className="text-right py-3 font-bold w-16">Tax</th>
                      <th className="text-right py-3 font-bold w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-3">
                          {item.description || 'Item description'}
                        </td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">₹{item.price.toFixed(2)}</td>
                        <td className="py-3 text-right">{item.tax}%</td>
                        <td className="py-3 text-right font-semibold">₹{calculateItemTotal(item).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tax:</span>
                    <span className="font-semibold">₹{totalTax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-gray-600">
                <p>Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}