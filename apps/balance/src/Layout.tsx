import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react';
import { type nameProps } from './Types.ts'
import './Layout.css'
import { tableSort } from './tableSort.ts';

interface childrenProps {
  children: ReactNode
}

interface regionProps extends childrenProps {
  id?: string,
  className?: string,
}

function Region({ children, id, className }: regionProps) {
  return (
    <div className={'region' + (className ? ' ' + className : '')} id={id}>
      {children}
    </div>
  );
}

function Subregion({ children, id, className }: regionProps) {
  return (
    <div className={'subregion' + (className ? ' ' + className : '')} id={id}>
      {children}
    </div>
  );
}

function Grouping({ children }: childrenProps) {
  return (
    <div className='grouping'>
      {children}
    </div>
  );
}

interface splitRegionProps extends childrenProps {
  fraction: string
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

function HorizontalRegion({ children, fraction = "1fr" }: splitRegionProps) {
  return (
    <div className='horizontalRegion' style={{ '--fraction': fraction }}>
      {children}
    </div>
  );
}

function VerticalRegion({ children, fraction = "1fr" }: splitRegionProps) {
  return (
    <div className='verticalRegion' style={{ '--fraction': fraction }}>
      {children}
    </div>
  );
}

interface MultiPaneProps extends childrenProps {
  selected?: number,
  setSelected?: (arg0: number) => void;
}

function MultiPane({ selected, setSelected, children }: MultiPaneProps) {
  if (!selected && !setSelected)
    [selected, setSelected] = useState(0);

  function addButton(child: ReactNode, index: number) {
    if (!isValidElement(child)) return;
    if (!setSelected) return;
    if (!child.props) return;

    const props = child.props as nameProps
    const name = props.name ?? 'Missing Component Name';
    return <button
      className={'topButton' + (selected === index ? ' selected' : '')}
      onClick={() => setSelected(index)}>
      {name}
    </button>
  }
  const mobile = false;

  useEffect(() => {
    tableSort()
  }, [selected]);

  return (
    <>
      {mobile ? (
        <div className='multiPane' >
          <div className='multiPane-topBar'>
            {Children.map(children, addButton)}
          </div>
          <div className='multiPane-body'>
            {Children.map(children, (child: ReactNode, index: number) => {
              return index === selected && child;
            })}
          </div>
        </div>
      )
        :
        (
          <div className='multiPane'>
            <div className='multiPane-topBar'>
              {Children.map(children, addButton)}
            </div>
            <div className='multiPane-body'>
              {Children.map(children, (child: ReactNode, index: number) => {
                return index === selected && child;
              })}
            </div>
          </div>
        )
      }
    </>
  );
}

function showPopupDialog(title: string, text: string) {
  const dialog = document.createElement('dialog');
  dialog.classList.add("popupDialog")
  dialog.onclose = () => dialog.remove()
  dialog.closedBy = 'all';
  const div = document.createElement('div');
  dialog.appendChild(div);
  const header = document.createElement("h3");
  header.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  const button = document.createElement("button");
  button.textContent = "Close";
  button.onclick = () => dialog.close()
  div.appendChild(header);
  div.appendChild(paragraph);
  div.appendChild(button);
  document.body.appendChild(dialog);
  dialog.showModal();
}

export { Region, Subregion, HorizontalRegion, VerticalRegion, Grouping, MultiPane, showPopupDialog }
