import { useState, useEffect } from 'react'
import './App.css'
import BillSplitter from './utils/BillSplitter'
import appInsights from './utils/AppInsights';

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
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [items, setItems] = useState([])
  const [itemForm, setItemForm] = useState({
    name: '',
    rate: '',
    quantity: '',
    discount_percent: '',
    shared_by: ''
  })
  const [editingItemIndex, setEditingItemIndex] = useState(null)
  const [groups, setGroups] = useState([])
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    members: ''
  })
  const [editingGroupIndex, setEditingGroupIndex] = useState(null)
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
    setGroups([]);
    setGroupForm({
      group_name: '',
      members: ''
    });
    setBillSummary(null);
    setShares({});
    setTax(5);
    setDiscount(0);
    setError(null);
  }

  const normalizeNames = (names) => {
    return names.map(name => name.trim().toLowerCase())
  }

  const formatNames = (names) => {
    // Create a map of lowercase to properly cased names from existing items and groups
    const properCaseMap = new Map()
    
    // Add names from existing items
    items.forEach(item => {
      item.shared_by.forEach(name => {
        properCaseMap.set(name.toLowerCase(), name)
      })
    })
    
    // Add names from groups
    groups.forEach(group => {
      group.members.forEach(name => {
        properCaseMap.set(name.toLowerCase(), name)
      })
    })

    // Format each name, using existing casing if available
    return names.map(name => {
      const normalizedName = name.trim().toLowerCase()
      return properCaseMap.get(normalizedName) || name.trim()
    })
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    const sharedByArray = itemForm.shared_by.split(',').map(person => person.trim())
    const formattedNames = formatNames(sharedByArray)
    const newItem = {
      ...itemForm,
      rate: parseFloat(itemForm.rate),
      quantity: parseInt(itemForm.quantity),
      discount_percent: parseFloat(itemForm.discount_percent) || 0,
      shared_by: formattedNames
    }

    if (editingItemIndex !== null) {
      // Editing existing item
      const updatedItems = [...items]
      updatedItems[editingItemIndex] = newItem
      setItems(updatedItems)
      setEditingItemIndex(null)
    } else {
      // Adding new item
      setItems([...items, newItem])
    }

    setItemForm({
      name: '',
      rate: '',
      quantity: '',
      discount_percent: '',
      shared_by: ''
    })
    setIsAddModalOpen(false)
  }

  const handleEditItem = (index) => {
    const item = items[index]
    setItemForm({
      ...item,
      shared_by: item.shared_by.join(', ')
    })
    setEditingItemIndex(index)
    setIsAddModalOpen(true)
  }

  const handleDeleteItem = () => {
    if (editingItemIndex !== null) {
      const updatedItems = items.filter((_, index) => index !== editingItemIndex)
      setItems(updatedItems)
      setEditingItemIndex(null)
      setIsAddModalOpen(false)
    }
  }

  const handleAddGroup = (e) => {
    e.preventDefault()
    console.log('Group created:', groupForm)
    const membersArray = groupForm.members.split(',').map(member => member.trim())
    const formattedNames = formatNames(membersArray)
    const newGroup = {
      group_name: groupForm.group_name,
      members: formattedNames
    }

    if (editingGroupIndex !== null) {
      // Editing existing group
      const updatedGroups = [...groups]
      updatedGroups[editingGroupIndex] = newGroup
      setGroups(updatedGroups)
      setEditingGroupIndex(null)
    } else {
      // Adding new group
      setGroups([...groups, newGroup])
    }

    setGroupForm({
      group_name: '',
      members: ''
    })
    setIsGroupModalOpen(false)
  }

  const handleEditGroup = (index) => {
    const group = groups[index]
    setGroupForm({
      group_name: group.group_name,
      members: group.members.join(', ')
    })
    setEditingGroupIndex(index)
    setIsGroupModalOpen(true)
  }

  const handleDeleteGroup = () => {
    if (editingGroupIndex !== null) {
      const updatedGroups = groups.filter((_, index) => index !== editingGroupIndex)
      setGroups(updatedGroups)
      setEditingGroupIndex(null)
      setIsGroupModalOpen(false)
    }
  }

  const calculateBill = () => {
    try {
      setLoading(true)
      setError(null)
      appInsights.trackEvent({ name: 'CalculateBillClicked' });
      console.log('Calculating bill...');
      
      const billSplitter = new BillSplitter();
      
      // Add all items
      items.forEach(item => {
        const itemRate = item.rate * (1 - (item.discount_percent || 0) / 100);
        billSplitter.addItem(
          item.name,
          itemRate,
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

  useEffect(() => {
    // when any item data changes, I want to recalculate the bill
    if (billSummary !== null) {
      calculateBill()
    }
  }, [items, tax, discount]) // dependencies: items, tax, discount

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>Bill Splitter</h1>
          <div className="header-controls">
            <button onClick={() => setIsGroupModalOpen(true)} className="group-button">
              Create Group
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="add-button">
              Add Item
            </button>
            {(items.length > 0 || groups.length > 0) && (
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
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <button 
                        className="edit-button"
                        onClick={() => handleEditItem(index)}
                        title="Edit Item"
                      >
                        ✎
                      </button>
                    </div>
                    <p>Price: Rs {item.rate} × {item.quantity}</p>
                    {item.discount_percent > 0 && (
                      <p>Item Discount: {item.discount_percent}%</p>
                    )}
                    <p>Shared by: {item.shared_by.join(', ')}</p>
                  </div>
                ))
              )}
            </div>

            <div className="groups-list">
              {groups.length > 0 && (
                <div className="groups-container">
                  <h2>Groups</h2>
                  <div className="groups-grid">
                    {groups.map((group, index) => (
                      <div key={index} className="group-card">
                        <div className="group-header">
                          <h3>{group.group_name}</h3>
                          <div className="group-header-right">
                            <span className="member-count">{group.members.length} members</span>
                            <button 
                              className="edit-button"
                              onClick={() => handleEditGroup(index)}
                              title="Edit Group"
                            >
                              ✎
                            </button>
                          </div>
                        </div>
                        <div className="members-list">
                          {group.members.map((member, mIndex) => (
                            <span key={mIndex} className="member-tag">{member}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                <p className="credit-note">
                  Split using <a href="https://afeefaa.github.io/bill_splitter" target="_blank" rel="noopener noreferrer">afeefaa.github.io/bill_splitter</a>
                </p>
                {Object.entries(shares).map(([person, amount]) => (
                  <p key={person}>{person}: Rs {amount.toFixed(2)}</p>
                ))}
               
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => {
        setIsAddModalOpen(false);
        setItemForm({
          name: '',
          rate: '',
          quantity: '',
          discount_percent: '',
          shared_by: ''
        });
        setEditingItemIndex(null);
      }}>
        <div className="add-item-form">
          <h2>{editingItemIndex !== null ? 'Edit Item' : 'Add Item'}</h2>
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
                type="number"
                placeholder="Item Discount (%)"
                value={itemForm.discount_percent}
                onChange={(e) => setItemForm({...itemForm, discount_percent: e.target.value})}
              />
            </div>
            <div className="form-group shared-by-group">
              <div className="group-dropdown">
                <label>Select Groups:</label>
                {groups.map((group, index) => (
                  <div key={index} className="group-checkbox">
                    <input
                      type="checkbox"
                      id={`group-${index}`}
                      onChange={(e) => {
                        const currentNames = itemForm.shared_by ? itemForm.shared_by.split(',').map(n => n.trim()) : [];
                        if (e.target.checked) {
                          // Add group members if not already present (case-insensitive)
                          const normalizedCurrent = normalizeNames(currentNames);
                          const newNames = currentNames.slice();
                          group.members.forEach(member => {
                            if (!normalizedCurrent.includes(member.toLowerCase())) {
                              newNames.push(member);
                            }
                          });
                          setItemForm({...itemForm, shared_by: newNames.join(', ')});
                        } else {
                          // Remove group members (case-insensitive)
                          const normalizedGroupMembers = normalizeNames(group.members);
                          const remainingNames = currentNames.filter(name => 
                            !normalizedGroupMembers.includes(name.toLowerCase())
                          );
                          setItemForm({...itemForm, shared_by: remainingNames.join(', ')});
                        }
                      }}
                    />
                    <label htmlFor={`group-${index}`}>{group.group_name}</label>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Shared by (names separated by commas)"
                value={itemForm.shared_by}
                onChange={(e) => setItemForm({...itemForm, shared_by: e.target.value})}
                required
              />
            </div>
            
            <div className="modal-actions">
              {editingItemIndex !== null && (
                <button type="button" className="delete-button" onClick={handleDeleteItem}>
                  Delete Item
                </button>
              )}
              <button type="submit">{editingItemIndex !== null ? 'Save Changes' : 'Add Item'}</button>
              
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isGroupModalOpen} onClose={() => {
        setIsGroupModalOpen(false);
        setGroupForm({
          group_name: '',
          members: ''
        });
        setEditingGroupIndex(null);
      }}>
        <div className="add-group-form">
          <h2>{editingGroupIndex !== null ? 'Edit Group' : 'Create Group'}</h2>
          <form onSubmit={handleAddGroup}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Group name"
                value={groupForm.group_name}
                onChange={(e) => setGroupForm({...groupForm, group_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Members (names separated by commas)"
                value={groupForm.members}
                onChange={(e) => setGroupForm({...groupForm, members: e.target.value})}
                required
              />
            </div>
            <div className="modal-actions">
              {editingGroupIndex !== null && (
                <button type="button" className="delete-button" onClick={handleDeleteGroup}>
                  Delete Group
                </button>
              )}
              <button type="submit">
                {editingGroupIndex !== null ? 'Save Changes' : 'Create Group'}
              </button>
              
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}

export default App
