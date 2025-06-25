import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

const BlockCreator = ({ element }) => {
  const Tag = element.nodeName.toLowerCase();

  return (
    <Tag
      className={element.className}
      dangerouslySetInnerHTML={{ __html: element.innerHTML }}
    />
  );
};

const A4Page = ({ children, Header, Footer, callBack }) => (
  <div className='page w-[210mm] min-h-[1122px] flex flex-col justify-between shadow-lg'>
    <Header />
    <div className='flex-1'>{children}</div>
    <Footer />
  </div>
);

const PDFPreview = ({ pdfRef, header, footer, target }) => {
  const [pageMeasurements, setPageMeasureMents] = useState({ A4: 1122 });

  const A4_HEIGHT = 1122;
  const HEADER_HEIGHT = 100;
  const FOOTER_HEIGHT = 80;
  const AVAILABLE_HEIGHT = A4_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (!pdfRef.current) return;

    const pdfElements = Array.from(pdfRef.current.children || []);
    const fragments = [];
    let currentHeight = 0;
    let currentPage = [];

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.width = '210mm';
    container.style.padding = '24px';
    container.style.boxSizing = 'border-box';
    document.body.appendChild(container);

    for (const element of pdfElements) {
      const clone = element.cloneNode(true);
      container.appendChild(clone);

      const height = clone.getBoundingClientRect().height;

      container.removeChild(clone);

      // Case 1: Element is taller than AVAILABLE_HEIGHT → push alone
      if (height > AVAILABLE_HEIGHT) {
        if (currentPage.length > 0) {
          fragments.push([...currentPage]);
          currentPage = [];
          currentHeight = 0;
        }

        fragments.push([element]); // Standalone page
        continue;
      }

      // Case 2: Adding this element will exceed page height → push current, start new
      if (currentHeight + height > AVAILABLE_HEIGHT) {
        fragments.push([...currentPage]);
        currentPage = [element];
        currentHeight = height;
      } else {
        currentPage.push(element);
        currentHeight += height;
      }
    }

    if (currentPage.length > 0) {
      fragments.push([...currentPage]);
    }

    setPages(fragments);
    document.body.removeChild(container);
  }, [pdfRef]);

  return (
    <>
      <button
        onClick={async () => {
          const element = target.current;

          html2pdf()
            .set({
              pagebreak: {
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after',
              },
              html2canvas: {
                scale: 2,
                useCORS: true,
                width: element.getBoundingClientRect().width,
              },
              jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                hotfixes: ['px_scaling'],
              },
            })
            .from(element)
            .save('invoice.pdf');
        }}
      >
        Save
      </button>
      <div className='flex justify-center'>
        <div ref={target}>
          {pages.map((chunk, i) => (
            <A4Page
              key={i}
              Header={header}
              Footer={footer}
            >
              {chunk.map((el, idx) => {
                console.log(el);
                return (
                  <BlockCreator
                    key={idx}
                    element={el}
                  />
                );
              })}
            </A4Page>
          ))}
        </div>
      </div>
    </>
  );
};

export default PDFPreview;
