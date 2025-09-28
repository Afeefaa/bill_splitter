import { useState } from 'react'
import './App.css'
import BillSplitter from './utils/BillSplitter'

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [items, setItems] = useState([])
  const [itemForm, setItemForm] = useState({
    name: '',
    rate: '',
    quantity: '',
    shared_by: ''
  })
  const [tax, setTax] = useState(5)
  const [discount, setDiscount] = useState(0)
  const [billSummary, setBillSummary] = useState(null)
  const [shares, setShares] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resetAll = () => {
    setItems([]);
    setItemForm({
      name: '',
      rate: '',
      quantity: '',
      shared_by: ''
    });
    setBillSummary(null);
    setShares({});
    setTax(5);
    setDiscount(0);
    setError(null);
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    const sharedByArray = itemForm.shared_by.split(',').map(person => person.trim())
    const newItem = {
      ...itemForm,
      rate: parseFloat(itemForm.rate),
      quantity: parseInt(itemForm.quantity),
      shared_by: sharedByArray
    }
    setItems([...items, newItem])
    setItemForm({
      name: '',
      rate: '',
      quantity: '',
      shared_by: ''
    })
    setIsAddModalOpen(false)
  }

  const calculateBill = () => {
    try {
      setLoading(true)
      setError(null)
      
      const billSplitter = new BillSplitter();
      
      // Add all items
      items.forEach(item => {
        billSplitter.addItem(
          item.name,
          item.rate,
          item.quantity,
          item.shared_by
        );
      });

      // Set tax and discount
      billSplitter.setTax(parseFloat(tax));
      billSplitter.setDiscount(parseFloat(discount));

      // Calculate the bill
      const result = billSplitter.calculateBill();
      
      setBillSummary({
        subtotal: result.subtotal,
        taxAmount: result.tax_amount,
        discountAmount: result.discount_amount,
        finalTotal: result.final_total
      });
      
      // Set the shares
      setShares(result.shares);
    } catch (err) {
      setError(err.message)
      console.error('Error calculating bill:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>Bill Splitter</h1>
          <div className="header-controls">
            <button onClick={() => setIsAddModalOpen(true)} className="add-button">
              Add Item
            </button>
            {items.length > 0 && (
              <button onClick={resetAll} className="reset-button">
                Start New Bill
              </button>
            )}
          </div>
        </div>

        <div className="main-content">
          <div className="left-panel">
            <div className="items-list">
              <h2>Items</h2>
              {items.length === 0 ? (
                <p className="no-items">No items added yet. Click "Add Item" to start.</p>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="item-card">
                    <h3>{item.name}</h3>
                    <p>Price: Rs {item.rate} × {item.quantity}</p>
                    <p>Shared by: {item.shared_by.join(', ')}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="right-panel">
            <div className="bill-controls">
              <div className="form-group">
                <label>Tax (%): </label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Discount (%): </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  step="0.1"
                />
              </div>
              <button 
                onClick={calculateBill} 
                disabled={loading || items.length === 0}
                className="calculate-button"
              >
                {loading ? 'Calculating...' : 'Calculate Bill'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {billSummary && (
              <div className="bill-summary">
                <h2>Bill Summary</h2>
                <p>Subtotal: Rs {billSummary.subtotal.toFixed(2)}</p>
                <p>Tax ({tax}%): Rs {billSummary.taxAmount.toFixed(2)}</p>
                <p>Discount ({discount}%): Rs {billSummary.discountAmount.toFixed(2)}</p>
                <p className="total">Total: Rs {billSummary.finalTotal.toFixed(2)}</p>
              </div>
            )}

            {Object.keys(shares).length > 0 && (
              <div className="shares-summary">
                <h2>Individual Shares</h2>
                {Object.entries(shares).map(([person, amount]) => (
                  <p key={person}>{person}: Rs {amount.toFixed(2)}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <div className="add-item-form">
          <h2>Add Item</h2>
          <form onSubmit={handleAddItem}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Item name"
                value={itemForm.name}
                onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Price per unit"
                value={itemForm.rate}
                onChange={(e) => setItemForm({...itemForm, rate: e.target.value})}
                required
                step="0.01"
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Quantity"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Shared by (names separated by commas)"
                value={itemForm.shared_by}
                onChange={(e) => setItemForm({...itemForm, shared_by: e.target.value})}
                required
              />
            </div>
            <button type="submit">Add Item</button>
          </form>
        </div>
      </Modal>
    </>
  )
}

export default App
