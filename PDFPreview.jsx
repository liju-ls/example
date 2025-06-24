import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';

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
  <div className='page w-[210mm] h-[297mm] mb-10 flex flex-col justify-between shadow-lg'>
    <Header />
    <div className='flex-1 overflow-hidden'>{children}</div>
    <Footer />
  </div>
);

const PDFPreview = ({ pdfRef, header, footer }) => {
  const [pageMeasurements, setPageMeasureMents] = useState({ A4: 1122 });
  const contentRef = useRef(null);

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

    pdfElements.forEach((element) => {
      const clone = element.cloneNode(true);
      container.appendChild(clone);

      const height = clone.clientHeight;

      if (currentHeight + height > AVAILABLE_HEIGHT) {
        fragments.push([...currentPage]);
        currentPage = [clone];
        currentHeight = height;
      } else {
        currentPage.push(clone);
        currentHeight += height;
      }
    });

    if (currentPage.length) fragments.push(currentPage);

    setPages(fragments);
    document.body.removeChild(container);
  }, []);

  return (
    <>
      <button
        onClick={async () => {
          const element = contentRef.current;

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
      <div className='py-10 flex justify-center'>
        <div ref={contentRef}>
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
