interface SecondProps {
  isOpen: boolean
  children: React.ReactNode
}

const Second: React.FC<SecondProps> = ({ isOpen, children }) => {
  return (
    <div className={`second ${isOpen ? 'open' : 'close'}`}>
      second
      {children}
    </div>
  )
}

export default Second
