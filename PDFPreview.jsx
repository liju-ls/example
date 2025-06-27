import React, {
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

const BlockCreator = ({ element }) => {
  const Tag = element.nodeName.toLowerCase();
  return (
    <Tag
      className={element.className}
      dangerouslySetInnerHTML={{ __html: element.innerHTML }}
    />
  );
};

const A4Page = ({ children, Header, Footer }) => (
  <div
    className={`page w-[210mm] h-[297mm] flex flex-col justify-between shadow-md border`}
    style={{ borderColor: '#E8E8E8' }}
  >
    <Header />
    <div className='flex-1'>{children}</div>
    <Footer />
  </div>
);

const PDFPreview = forwardRef(
  ({ pdfRef, HeaderSection, FooterSection }, ref) => {
    const headerRef = useRef(null);
    const footerRef = useRef(null);
    const targetRef = useRef(null);

    const A4_HEIGHT = 1122;
    const [pages, setPages] = useState([]);

    const downloadPdfContent = async () => {
      if (!targetRef.current) return;

      try {
        const canvas = await html2canvas(targetRef.current, {
          useCORS: true,
          scale: 2,
          onclone: (el) => {
            document.querySelectorAll('.page').forEach((el) => {
              el.removeAttribute('border');
              el.classList.remove('border-gray-200');
            });
          },
        });

        const fullWidth = canvas.width;
        const fullHeight = canvas.height;

        const A4_WIDTH_PT = 595.28;
        const A4_HEIGHT_PT = 841.89;

        const scale = A4_WIDTH_PT / fullWidth;
        const sliceHeight = A4_HEIGHT_PT / scale;

        const totalPages = Math.ceil(fullHeight / sliceHeight);

        const pdfDoc = await PDFDocument.create();

        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          const offset = pageNum * sliceHeight;
          const currentSliceHeight = Math.min(sliceHeight, fullHeight - offset);

          if (
            currentSliceHeight <= 0 ||
            (pageNum === totalPages - 1 &&
              currentSliceHeight < sliceHeight &&
              fullHeight % sliceHeight < sliceHeight * 0.1)
          ) {
            continue;
          }

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = fullWidth;
          sliceCanvas.height = currentSliceHeight;

          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0,
            offset,
            fullWidth,
            currentSliceHeight,
            0,
            0,
            fullWidth,
            currentSliceHeight
          );

          const imgData = sliceCanvas.toDataURL('image/png');
          const imgBytes = await fetch(imgData).then((res) =>
            res.arrayBuffer()
          );
          const image = await pdfDoc.embedPng(imgBytes);
          const scaled = image.scale(scale);

          const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
          page.drawImage(image, {
            x: 0,
            y: A4_HEIGHT_PT - scaled.height,
            width: scaled.width,
            height: scaled.height,
          });
        }

        if (pdfDoc.getPageCount() === 0) return;

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'multipage.pdf';
        link.click();
      } catch (err) {
        console.log(err);
      }
    };

    useEffect(() => {
      if (!pdfRef.current) return;
      if (!headerRef.current) return;
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

      const headerHeight = headerRef.current.getBoundingClientRect().height;
      headerRef.current.style.position = 'absolute';
      headerRef.current.style.visibility = 'hidden';

      const footerHeight = footerRef.current.getBoundingClientRect().height;
      footerRef.current.style.position = 'absolute';
      footerRef.current.style.visibility = 'hidden';

      const headerStyles = getComputedStyle(headerRef.current);
      const AVAILABLE_HEIGHT =
        A4_HEIGHT -
        (headerHeight +
          parseFloat(headerStyles.marginBottom || 0) +
          parseFloat(headerStyles.marginTop || 0)) -
        footerHeight;

      for (const element of pdfElements) {
        const clone = element.cloneNode(true);
        const cloneStyles = getComputedStyle(clone);

        container.appendChild(clone);

        const height =
          clone.getBoundingClientRect().height +
          parseFloat(cloneStyles.marginTop) +
          parseFloat(cloneStyles.marginBottom);

        container.removeChild(clone);

        if (height > AVAILABLE_HEIGHT) {
          if (currentPage.length > 0) {
            fragments.push([...currentPage]);
            currentPage = [];
            currentHeight = 0;
          }

          fragments.push([element]);
          continue;
        }

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

    useImperativeHandle(ref, () => ({
      downloadPdf: downloadPdfContent,
    }));

    return (
      <>
        <HeaderSection headerRef={headerRef} />
        <FooterSection footerRef={footerRef} />

        <div className='flex justify-center'>
          <div
            ref={targetRef}
            className=''
          >
            {pages.map((chunk, i) => (
              <Fragment key={i}>
                <A4Page
                  Header={HeaderSection}
                  Footer={FooterSection}
                >
                  {chunk.map((el, idx) => {
                    return (
                      <BlockCreator
                        key={idx}
                        element={el}
                      />
                    );
                  })}
                </A4Page>
                <div
                  data-html2canvas-ignore
                  className='mt-10'
                ></div>
              </Fragment>
            ))}
          </div>
        </div>
      </>
    );
  }
);

export default PDFPreview;
