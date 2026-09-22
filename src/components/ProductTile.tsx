import { formatPrice, type Product } from "@/lib/products";
import { AddToCart } from "./AddToCart";
import { ProductArt } from "./ProductArt";

export function ProductTile({ product, index }: { product: Product; index: number }) {
  return (
    <li>
      <ProductArt index={index} kind={product.kind} imgUrl={product.imgUrl} /> 
      <div className="product-info">
        <h3>{product.name}</h3>
        <span className="price">{formatPrice(product.price)}</span>
      </div>
      <p className="product-blurb">{product.blurb}</p>
      <AddToCart id={product.id} name={product.name} />
    </li>
  );
}
