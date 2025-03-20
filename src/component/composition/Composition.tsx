import { Add } from '@carbon/icons-react'
import { Button } from '@carbon/react'

interface CompositionProps {}

const Composition: React.FC<CompositionProps> = ({}) => {
  return (
    <div className="composition">
      컴포지션
      <Button kind="primary" renderIcon={Add}>
        버튼
      </Button>
    </div>
  )
}

export default Composition
