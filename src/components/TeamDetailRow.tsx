import { Link } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import type { ContributorType } from '../lib/catalog/catalog'

export interface ContributorLink {
  id: number
  name: string
  type: ContributorType
}

interface TeamDetailRowProps {
  label: string
  contributors: ContributorLink[]
}

function TeamDetailRow({ label, contributors }: TeamDetailRowProps) {
  if (contributors.length === 0) {
    return null
  }

  return (
    <div className="detail-row">
      <span className="detail-row__icon">
        <Music2 size={28} />
      </span>
      <div className="detail-row__copy">
        <span>{label}</span>
        <div className="detail-row__links">
          {contributors.map((contributor, index) => (
            <Link
              key={`${contributor.type}-${contributor.id}`}
              className="detail-row__link"
              to={`/contributors/${contributor.type}/${contributor.id}`}
            >
              {contributor.name}
              {index < contributors.length - 1 ? '،' : ''}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeamDetailRow
