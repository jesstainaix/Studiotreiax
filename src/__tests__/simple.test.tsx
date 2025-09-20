import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Componente simples para teste
const SimpleComponent = () => {
  return (
    <div>
      <h1>Teste Simples</h1>
      <p>Este é um teste básico do ambiente</p>
    </div>
  )
}

describe('Teste Simples do Ambiente', () => {
  it('deve renderizar o componente simples', () => {
    render(<SimpleComponent />)
    
    expect(screen.getByText('Teste Simples')).toBeInTheDocument()
    expect(screen.getByText('Este é um teste básico do ambiente')).toBeInTheDocument()
  })

  it('deve executar um teste básico de matemática', () => {
    expect(2 + 2).toBe(4)
    expect('hello'.toUpperCase()).toBe('HELLO')
  })

  it('deve testar arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })
})