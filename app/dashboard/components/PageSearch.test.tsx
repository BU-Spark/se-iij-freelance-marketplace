import { fireEvent, render, screen } from '@testing-library/react';
import Link from 'next/link';
import PageSearch from './PageSearch';

function setup() {
  render(
    <>
      <PageSearch targetId="content" />
      <main id="content">
        <section>
          <h2>Assignments</h2>
          <ul>
            <li>
              <article>
                <h3>
                  <Link href="/dashboard/assignments/council">City council budget vote</Link>
                </h3>
                <p>Cover the council meeting tonight</p>
              </article>
            </li>
            <li>
              <article>
                <h3>Harbor festival photos</h3>
                <p>Weekend photo shoot</p>
              </article>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
  return screen.getByRole('combobox', { name: 'Search the dashboard' });
}

describe('PageSearch', () => {
  it('lists one option per matching card, with its section', () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'council' } });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('City council budget vote');
    expect(options[0]).toHaveTextContent('Assignments');
    expect(screen.getByRole('status')).toHaveTextContent('2 matches');
  });

  it('opens the card link when it has one', () => {
    const input = setup();
    const link = screen.getByRole('link', { name: 'City council budget vote' });
    const click = jest.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', click);

    fireEvent.change(input, { target: { value: 'council' } });
    fireEvent.mouseDown(screen.getByRole('option'));

    expect(click).toHaveBeenCalled();
  });

  it('scrolls to a card with no link when its option is clicked', () => {
    const input = setup();
    const scroll = jest.fn();
    const card = screen.getByText('Harbor festival photos').closest('article')!;
    card.scrollIntoView = scroll;

    fireEvent.change(input, { target: { value: 'photo' } });
    fireEvent.mouseDown(screen.getByRole('option'));

    expect(scroll).toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('says so when nothing matches', () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'zebra' } });
    expect(screen.getByText('No matches on this page')).toBeInTheDocument();
  });
});
