from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    name: str
    rate: float
    quantity: int
    shared_by: List[str]

class BillRequest(BaseModel):
    items: List[Item]
    tax_percent: float = 0.0
    discount_percent: float = 0.0

class BillSplitter:
    def __init__(self):
        self.items = []
        self.people = set()
        self.tax_percent = 0.0
        self.discount_percent = 0.0
        
    def add_item(self, item_name: str, rate: float, quantity: int, shared_by: list[str]) -> None:
        """
        Add an item to the bill with its details and who shared it.
        
        Args:
            item_name: Name of the food item
            rate: Price per unit of the item
            quantity: Number of units ordered
            shared_by: List of people who shared this item
        """
        self.items.append({
            'name': item_name,
            'rate': rate,
            'quantity': quantity,
            'shared_by': shared_by
        })
        self.people.update(shared_by)
    
    def set_tax(self, tax: float = 5, is_percentage: bool = True) -> None:
        """
        Set tax amount or percentage.
        
        Args:
            tax: Tax value
            is_percentage: If True, tax is in percentage, else absolute amount
        """
        if tax < 0:
            raise ValueError("Tax cannot be negative")
            
        if is_percentage:
            self.tax_percent = tax
        else:
            subtotal = self.get_subtotal()
            self.tax_percent = (tax / subtotal) * 100 if subtotal > 0 else 0
            
    def set_discount(self, discount_percent: float) -> None:
        """
        Set discount percentage.
        
        Args:
            discount_percent: Discount percentage
        """
        self.discount_percent = discount_percent
        
    def get_subtotal(self) -> float:
        """Calculate subtotal before tax and discount"""
        return sum(item['rate'] * item['quantity'] for item in self.items)
        
    def calculate_shares(self) -> dict[str, float]:
        """
        Calculate how much each person owes including tax and discount.
        
        Returns:
            Dictionary with person name as key and their share amount as value
        """
        shares = {person: 0.0 for person in self.people}
        
        # Calculate base shares
        for item in self.items:
            item_total = item['rate'] * item['quantity']
            share_per_person = item_total / len(item['shared_by'])
            
            for person in item['shared_by']:
                shares[person] += share_per_person
        
        # Apply tax proportionally
        subtotal = self.get_subtotal()
        tax_amount = subtotal * (self.tax_percent / 100)
        
        # Apply discount proportionally
        discount_amount = subtotal * (self.discount_percent / 100)
        
        # Adjust each person's share with tax and discount
        for person in shares:
            person_ratio = shares[person] / subtotal if subtotal > 0 else 0
            shares[person] += (tax_amount * person_ratio)
            shares[person] -= (discount_amount * person_ratio)
                
        return shares

    def get_total_bill(self) -> dict[str, float]:
        """
        Calculate bill details including subtotal, tax, discount and final total.
        
        Returns:
            Dictionary containing bill breakdown
        """
        subtotal = self.get_subtotal()
        tax_amount = subtotal * (self.tax_percent / 100)
        discount_amount = subtotal * (self.discount_percent / 100)
        final_total = subtotal + tax_amount - discount_amount
        
        return {
            'subtotal': subtotal,
            'tax_amount': tax_amount,
            'tax_percent': self.tax_percent,
            'discount_amount': discount_amount,
            'discount_percent': self.discount_percent,
            'final_total': final_total
        }

@app.post("/calculate-bill")
async def calculate_bill(bill_request: BillRequest):
    # Create a new BillSplitter instance
    splitter = BillSplitter()
    
    # Add items from the request
    for item in bill_request.items:
        splitter.add_item(
            item_name=item.name,
            rate=item.rate,
            quantity=item.quantity,
            shared_by=item.shared_by
        )
    
    # Set tax and discount
    splitter.set_tax(bill_request.tax_percent)
    splitter.set_discount(bill_request.discount_percent)
    
    # Calculate bill details and shares
    bill_details = splitter.get_total_bill()
    shares = splitter.calculate_shares()
    
    # Combine the results
    return {
        **bill_details,
        "shares": shares
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Example usage
bill = BillSplitter()  # Initialize without default tax

# Adding items
bill.add_item("Pizza", 20.0, 1, ["Alice", "Bob", "Charlie"])
bill.add_item("Salad", 12.0, 1, ["Alice", "Bob"])
bill.add_item("Soda", 3.0, 2, ["Charlie"])

# Update tax and add discount
bill.set_tax()      # Change to 8% tax
bill.set_discount(10.0) # Set 10% discount

# Get individual shares
shares = bill.calculate_shares()
for person, amount in shares.items():
    print(f"{person} owes: ${amount:.2f}")

# Get complete bill breakdown
bill_details = bill.get_total_bill()
print("\nBill Breakdown:")
print(f"Subtotal: ${bill_details['subtotal']:.2f}")
print(f"Tax ({bill_details['tax_percent']}%): ${bill_details['tax_amount']:.2f}")
print(f"Discount ({bill_details['discount_percent']}%): ${bill_details['discount_amount']:.2f}")
print(f"Final Total: ${bill_details['final_total']:.2f}")

# okay this is pretty good, can we add the functionality in a larger app which does something like split the expenses among everyone? so here the catch is different people might be paying for dif