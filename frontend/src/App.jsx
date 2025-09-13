import { useState } from 'react'
import './App.css'

function App() {
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
  }

  const calculateBill = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:8000/calculate-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.name,
            rate: item.rate,
            quantity: item.quantity,
            shared_by: item.shared_by
          })),
          tax_percent: parseFloat(tax),
          discount_percent: parseFloat(discount)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate bill')
      }

      const data = await response.json()
      
      setBillSummary({
        subtotal: data.subtotal,
        taxAmount: data.tax_amount,
        discountAmount: data.discount_amount,
        finalTotal: data.final_total
      })
      
      setShares(data.shares)
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
        <h1>Bill Splitter</h1>
      
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

      <div className="items-list">
        <h2>Items</h2>
        {items.map((item, index) => (
          <div key={index} className="item-card">
            <h3>{item.name}</h3>
            <p>Price: ${item.rate} × {item.quantity}</p>
            <p>Shared by: {item.shared_by.join(', ')}</p>
          </div>
        ))}
      </div>

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
          <p>Subtotal: ${billSummary.subtotal.toFixed(2)}</p>
          <p>Tax ({tax}%): ${billSummary.taxAmount.toFixed(2)}</p>
          <p>Discount ({discount}%): ${billSummary.discountAmount.toFixed(2)}</p>
          <p className="total">Total: ${billSummary.finalTotal.toFixed(2)}</p>
        </div>
      )}

      {Object.keys(shares).length > 0 && (
        <div className="shares-summary">
          <h2>Individual Shares</h2>
          {Object.entries(shares).map(([person, amount]) => (
            <p key={person}>{person}: ${amount.toFixed(2)}</p>
          ))}
        </div>
      )}
      </div>
    </>
  )
}

export default App
