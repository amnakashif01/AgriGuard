export async function generateNegotiationMessage(
  supplierName: string,
  products: string[],
  quantity?: string,
  priceRange?: string
): Promise<string> {
  try {
    // Simple template-based message generation for client-side use
    const productsText = products.join(', ');
    const quantityText = quantity ? `I need approximately ${quantity}.` : '';
    const budgetText = priceRange ? `My budget is around ${priceRange}.` : '';
    
    return `السلام علیکم,

I am interested in purchasing ${productsText}. ${quantityText} ${budgetText}

Please share your best rates and availability at your earliest convenience.

JazakAllah.`;
  } catch (error) {
    console.error('Error generating message:', error);
    return `السلام علیکم, I am interested in purchasing ${products.join(', ')}. Please share your best rates and availability.`;
  }
}
