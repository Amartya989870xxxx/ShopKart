import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (search) {
          params.search = search;
        }

        if (category) {
          params.category = category;
        }

        const response = await api.get("/products", {
          params,
        });

        setProducts(response.data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);

        setError(
          "Something went wrong while loading products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  const hasFilters = Boolean(search || category);

  return (
    <Layout width="wide">
      <section className="catalog-hero">
        <div>
          <p className="eyebrow">ShopKart store</p>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            Discover products available on ShopKart.
          </p>
        </div>

        <SearchBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
        />
      </section>

      {!loading && !error && products.length > 0 && (
        <p className="results-count" aria-live="polite">
          Showing {products.length}{" "}
          {products.length === 1 ? "product" : "products"}
          {category && ` in ${category}`}
          {search && ` for “${search}”`}
        </p>
      )}

      {loading && (
        <StatePanel variant="loading" message="Loading products..." />
      )}

      {!loading && error && (
        <StatePanel variant="error" icon="!" title="Couldn't load products" message={error} />
      )}

      {!loading && !error && products.length === 0 && (
        <StatePanel
          icon="🔍"
          title="No products found"
          message={
            hasFilters
              ? "Try a different search term or category."
              : "Products will appear here once they are available."
          }
        >
          {hasFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
            >
              Clear filters
            </button>
          )}
        </StatePanel>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

export default Products;