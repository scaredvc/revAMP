import { MapPin } from 'lucide-react'

export default function InfoPanel({ point }) {
  if (!point) return null

  return (
    <div className="mt-4 p-4 border border-gray-300 rounded-md shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-2 flex items-center">
        <MapPin className="mr-2 text-blue-500" />
        {point.name}
      </h2>
      <p className="text-sm text-gray-600 mb-2">Coordinates: {point.coordinates.join(', ')}</p>
      <p className="mt-2 text-gray-800">{point.description}</p>
    </div>
  )
}

