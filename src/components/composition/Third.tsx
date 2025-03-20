interface ThirdProps {
  keyword: string
  items: string[]
}

const Third: React.FC<ThirdProps> = ({ keyword, items }) => {
  return (
    <div>
      Third {keyword} {items.length}
    </div>
  )
}

export default Third
