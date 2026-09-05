import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it('applies variant classes and merges custom classes', () => {
    render(
      <Button variant="destructive" className="w-full">
        Delete
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.className).toContain('bg-destructive');
    expect(button.className).toContain('w-full');
  });

  it('is disabled when disabled prop set', () => {
    render(<Button disabled>Wait</Button>);
    expect(screen.getByRole('button', { name: 'Wait' }).hasAttribute('disabled')).toBe(true);
  });
});
