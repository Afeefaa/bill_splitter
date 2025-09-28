class BillSplitter {
    constructor() {
        this.items = [];
        this.people = new Set();
        this.tax_percent = 0.0;
        this.discount_percent = 0.0;
    }

    addItem(item_name, rate, quantity, shared_by) {
        this.items.push({
            name: item_name,
            rate: rate,
            quantity: quantity,
            shared_by: shared_by
        });
        shared_by.forEach(person => this.people.add(person));
    }

    setTax(tax = 5) {
        if (tax < 0) {
            throw new Error("Tax cannot be negative");
        }
        this.tax_percent = tax;
    }

    setDiscount(discount_percent) {
        if (discount_percent < 0) {
            throw new Error("Discount cannot be negative");
        }
        this.discount_percent = discount_percent;
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.rate * item.quantity), 0);
    }

    getTaxAmount() {
        return (this.getSubtotal() * this.tax_percent) / 100;
    }

    getDiscountAmount() {
        const amountAfterTax = this.getSubtotal() + this.getTaxAmount();
        return (amountAfterTax * this.discount_percent) / 100;
    }

    getFinalTotal() {
        const amountAfterTax = this.getSubtotal() + this.getTaxAmount();
        return amountAfterTax - this.getDiscountAmount();
    }

    calculateShares() {
        const shares = {};
        const people = Array.from(this.people);
        people.forEach(person => {
            shares[person] = 0;
        });

        // Calculate base shares without tax and discount
        this.items.forEach(item => {
            const itemTotal = item.rate * item.quantity;
            const perPersonShare = itemTotal / item.shared_by.length;
            item.shared_by.forEach(person => {
                shares[person] += perPersonShare;
            });
        });

        // First apply tax proportionally
        const subtotal = Object.values(shares).reduce((a, b) => a + b, 0);
        const taxAmount = this.getTaxAmount();

        people.forEach(person => {
            const proportion = shares[person] / subtotal;
            shares[person] += (taxAmount * proportion);
        });

        // Then calculate and apply discount on amount after tax
        const totalAfterTax = Object.values(shares).reduce((a, b) => a + b, 0);
        const discountAmount = this.getDiscountAmount();

        people.forEach(person => {
            const proportionAfterTax = shares[person] / totalAfterTax;
            shares[person] -= (discountAmount * proportionAfterTax);
            // Round to 2 decimal places
            shares[person] = Math.round(shares[person] * 100) / 100;
        });

        return shares;
    }

    calculateBill() {
        return {
            subtotal: this.getSubtotal(),
            tax_amount: this.getTaxAmount(),
            discount_amount: this.getDiscountAmount(),
            final_total: this.getFinalTotal(),
            shares: this.calculateShares()
        };
    }
}

export default BillSplitter;