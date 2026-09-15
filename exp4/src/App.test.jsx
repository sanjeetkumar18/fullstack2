import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('calendar interface', () => {
  it('opens the composer and adds a post', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /new post/i }));
    fireEvent.change(screen.getByLabelText('Post title'), { target: { value: 'A thoughtful update' } });
    fireEvent.click(screen.getByRole('button', { name: /add to calendar/i }));
    expect(screen.getByText('New post added to your calendar.')).toBeInTheDocument();
    expect(screen.getByText('A thoughtful update')).toBeInTheDocument();
  });

  it('switches between month and list views', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /list view/i }));
    expect(screen.getByText('The quiet power of consistency')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /month view/i }));
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('exposes a live optimization switch and render counters', () => {
    render(<App />);
    expect(screen.getByText('Optimization on')).toBeInTheDocument();
    expect(screen.getByText('calendar cells')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /optimization on/i }));
    expect(screen.getByText('Optimization off')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reset counts/i }));
    expect(screen.getByRole('button', { name: /reset counts/i })).toBeInTheDocument();
  });
});
