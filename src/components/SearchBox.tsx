import { Search } from 'lucide-react'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean
}

function SearchBox({ value, onChange, placeholder, autoFocus }: SearchBoxProps) {
  return (
    <label className="search-box">
      <Search size={20} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </label>
  )
}

export default SearchBox
