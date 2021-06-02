import styled from 'styled-components'

const Container = styled.div`
	display: block;
`

const InputCheckbox = styled.input`
  cursor: pointer;
  display: none;
`

const InputLabel = styled.label`
  margin-left: 0.25rem;
  position: relative;
  color: ${({ theme }) => theme.textColor};
  font-size: 1rem;
  font-weight: 300;
  letter-spacing: 1px;
  text-decoration: none;
  cursor: pointer;
  user-select: none;

  &:before {
    content: '';
    appearance: none;
    border: 2px solid ${({ theme }) => theme.textColor};

    padding: 0.35rem;
    display: inline-block;
    top: 2px;
    left: 0.275rem;
    position: relative;
    margin-right: 1rem;
  }

  ${InputCheckbox}:checked + &:after {
    content: '';
    position: absolute;
    top: 5px;
    left: 10px;
    width: 4px;
    height: 9px;
    border: solid ${({ theme }) => theme.textColor};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`

const Checkbox = ({ label }) => {
	return (
    <Container>
      <InputCheckbox type="checkbox" id="checkbox" />
      <InputLabel for="checkbox">{label}</InputLabel>
    </Container>
  )
}

export default Checkbox
