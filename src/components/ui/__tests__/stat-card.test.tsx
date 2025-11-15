import { render, screen } from '@testing-library/react';
import { StatCard } from '../stat-card';
import { FileText } from 'lucide-react';

describe('StatCard', () => {
  it('renders the title, value, and description', () => {
    render(
      <StatCard
        title="Total des Interventions"
        value={123}
        icon={FileText}
        description="Test description"
      />
    );

    expect(screen.getByText('Total des Interventions')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
});
