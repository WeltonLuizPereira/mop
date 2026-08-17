import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('exposes the accessible label and a 44px touch target', () => {
    render(<IconButton label="Editar cliente" icon={<span />} size="touch" />);

    expect(screen.getByRole('button', { name: 'Editar cliente' }))
      .toHaveClass('min-h-11', 'min-w-11');
  });
});
