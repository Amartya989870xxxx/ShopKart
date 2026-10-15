function SearchBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}) {
  return (
    <div className="product-filters" role="search">
      <div className="search-field">
        <label htmlFor="product-search" className="visually-hidden">
          Search products
        </label>

        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <input
          id="product-search"
          className="input"
          type="search"
          placeholder="Search products..."
          autoComplete="off"
          spellCheck="false"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="category-field">
        <label htmlFor="product-category" className="visually-hidden">
          Filter by category
        </label>

        <select
          id="product-category"
          className="input select"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Books">Books</option>
          <option value="Home">Home</option>
        </select>
      </div>
    </div>
  );
}

export default SearchBar;