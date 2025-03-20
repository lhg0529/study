import { Add } from '@carbon/icons-react'
import { Button } from '@carbon/react'
import { useState } from 'react'
import Second from 'components/composition/Second'
import Third from 'components/composition/Third'

interface CompositionProps {}

const Composition: React.FC<CompositionProps> = ({}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<string[]>([])

  return (
    <div className="composition">
      컴포지션
      <Button kind="primary" renderIcon={Add}>
        버튼
      </Button>
      <Second isOpen={isOpen}>
        <Third keyword={keyword} items={items} />
      </Second>
    </div>
  )
}

export default Composition
