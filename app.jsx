import { PDFDocument } from 'pdf-lib';
import { useRef } from 'react';
import PDFPreview from './components/PDFPreview';
import html2canvas from 'html2canvas';

const Header = () => (
  <div className='!p-5 grid grid-cols-2 items-center border-b'>
    <div>
      <img
        src='./pngwing.com.png'
        alt='company-logo'
        height='100'
        width='100'
      />
    </div>

    <div className='text-right'>
      <p>Tailwind Inc.</p>
      <p className='text-sm'>sales@tailwindcss.com</p>
      <p className='text-sm mt-1'>+41-442341232</p>
      <p className='text-sm mt-1'>VAT: 8657671212</p>
    </div>
  </div>
);

const Footer = () => (
  <div className='h-[80px] border-t  mt-2 text-xs text-center pt-2'>
    <p>Thank you for your business.</p>
    <p>Page footer goes here.</p>
  </div>
);

const App = () => {
  const pdfRef = useRef(null);
  const targetRef = useRef(null);
  return (
    <>
      <button
        onClick={async () => {
          if (!targetRef.current) return;

          const canvas = await html2canvas(targetRef.current, {
            useCORS: true,
            scale: 2,
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
            const currentSliceHeight = Math.min(
              sliceHeight,
              fullHeight - offset
            );

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
        }}
      >
        faefe
      </button>

      <PDFPreview
        pdfRef={pdfRef}
        header={Header}
        footer={Footer}
        target={targetRef}
      />

      <div
        ref={pdfRef}
        className='absolute hidden'
      >
        {/* Page 1 */}
        <div className='mb-10 px-5'>
          <h1 className='text-3xl font-bold mb-4'>Invoice</h1>
          <div className='flex justify-between mb-4'>
            <div>
              <h2 className='font-bold'>Bill To:</h2>
              <p>John Doe</p>
              <p>123 Main St</p>
              <p>Anytown, USA 12345</p>
            </div>
            <div>
              <h2 className='font-bold'>Invoice Details:</h2>
              <p>Invoice #: INV123</p>
              <p>Date: June 25, 2024</p>
              <p>Due Date: July 25, 2024</p>
            </div>
          </div>
          <table className='w-full mb-4'>
            <thead>
              <tr>
                <th className='border p-2'>Item</th>
                <th className='border p-2'>Quantity</th>
                <th className='border p-2'>Rate</th>
                <th className='border p-2'>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='border p-2'>Service 1</td>
                <td className='border p-2'>2</td>
                <td className='border p-2'>$100.00</td>
                <td className='border p-2'>$200.00</td>
              </tr>
              {/* Add more items here */}
            </tbody>
          </table>
          <div className='flex justify-end'>
            <div>
              <p>Subtotal: $200.00</p>
              <p>Tax (10%): $20.00</p>
              <p className='font-bold'>Total: $220.00</p>
            </div>
          </div>
        </div>

        {/* Page 2 */}
        <div className='page-break mb-10 px-5'>
          <h2 className='text-xl font-bold mb-4'>
            Payment Terms and Conditions
          </h2>
          <ul>
            <li>Payment is due within 30 days of invoice date.</li>
            <li>
              A late fee of 1.5% per month will be applied to unpaid balances.
            </li>
            <li>Accepted payment methods include checks and bank transfers.</li>
          </ul>
        </div>

        {/* Page 3 */}
        <div className='px-5'>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div className='px-5'>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div className='px-5'>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div className='px-5'>
          <h2 className='text-xl font-bold mb-4'>Contact Us 111111</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us 11111111</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>

        <div>
          <h2 className='text-xl font-bold mb-4'>Contact Us</h2>
          <p>
            If you have any questions about this invoice, please contact us:
          </p>
          <p>Phone: 123-456-7890</p>
          <p>Email: [info@example.com](mailto:info@example.com)</p>
        </div>
      </div>
    </>
  );
};

export default App;
