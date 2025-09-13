class BillSplitter:
    def __init__(self, tax_percent: float = 5.0):
        self.items = []
        self.people = set()
        self.tax_percent = tax_percent
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
    
    def set_tax(self, tax: float, is_percentage: bool = True) -> None:
        """
        Set tax amount or percentage.
        
        Args:
            tax: Tax value
            is_percentage: If True, tax is in percentage, else absolute amount
        """
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

