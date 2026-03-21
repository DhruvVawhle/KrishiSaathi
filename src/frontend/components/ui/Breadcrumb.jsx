import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const Breadcrumb = ({ items }) => {
  const navigate = useNavigate()

  // Add schema
  React.useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": item.path ? `https://krishisaathi.vercel.app${item.path}` : undefined
      }))
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    script.id = 'breadcrumb-schema'
    const old = document.getElementById('breadcrumb-schema')
    if (old) old.remove()
    document.head.appendChild(script)
    return () => {
      const s = document.getElementById('breadcrumb-schema')
      if (s) s.remove()
    }
  }, [items])

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
        flexWrap: 'wrap'
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <ChevronRight
              size={14}
              color="#B0A898"
            />
          )}
          {item.path && index < items.length-1
            ? (
              <button
                onClick={() => navigate(item.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  color: '#7A7A7A',
                  cursor: 'pointer',
                  borderRadius: 4,
                  minHeight: 'auto'
                }}
              >
                {item.label}
              </button>
            ) : (
              <span style={{
                fontFamily: 'DM Sans',
                fontSize: 13,
                fontWeight: 600,
                color: '#2D4F1E',
                padding: '2px 4px'
              }}>
                {item.label}
              </span>
            )
          }
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Breadcrumb
