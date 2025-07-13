useEffect(() => {
      if (!pdfRef.current || !headerRef.current || !footerRef.current) return;

      const A4_HEIGHT = 1122; // px at 96dpi (11.69in × 96)

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.visibility = 'hidden';
      container.style.width = '210mm'; // A4 width
      container.style.padding = '24px';
      container.style.boxSizing = 'border-box';
      container.style.top = '0';
      container.style.left = '0';
      document.body.appendChild(container);

      const headerHeight = headerRef.current.getBoundingClientRect().height;
      const footerHeight = footerRef.current.getBoundingClientRect().height;
      const headerStyles = getComputedStyle(headerRef.current);
      const footerStyles = getComputedStyle(footerRef.current);

      const AVAILABLE_HEIGHT =
        A4_HEIGHT -
        (headerHeight +
          parseFloat(headerStyles.marginTop || '0') +
          parseFloat(headerStyles.marginBottom || '0')) -
        (footerHeight +
          parseFloat(footerStyles.marginTop || '0') +
          parseFloat(footerStyles.marginBottom || '0'));

      const pdfElements = Array.from(pdfRef.current.children);
      const fragments = [];
      let currentPage = [];
      let currentHeight = 0;

      function measureHeight(el) {
        container.appendChild(el);
        const elStyles = getComputedStyle(el);
        const height =
          el.getBoundingClientRect().height +
          parseFloat(elStyles.marginBottom) +
          parseFloat(elStyles.marginTop);
        container.removeChild(el);
        return height;
      }

      function cloneWithHidden(el, hiddenIndices = []) {
        const clone = el.cloneNode(true);

        const allNodes = Array.from(clone.querySelectorAll('*'));
        const leafNodes = allNodes.filter((e) => e.children.length === 0);

        // Step 1: Hide specified leaf nodes
        hiddenIndices.forEach((i) => {
          if (leafNodes[i]) leafNodes[i].style.display = 'none';
        });

        // Step 2: Recursively hide parents if all their children are hidden
        function hideEmptyParents(node) {
          if (!node || !node.children || node.children.length === 0) return;

          for (let child of Array.from(node.children)) {
            hideEmptyParents(child);
          }

          const allHidden = Array.from(node.children).every(
            (child) => child.style.display === 'none'
          );

          if (allHidden) {
            node.style.display = 'none';
          }
        }

        hideEmptyParents(clone);

        return clone;
      }

      function splitElement(element, maxHeight) {
        const originalClone = element.cloneNode(true);
        container.appendChild(originalClone);

        const leaves = Array.from(originalClone.querySelectorAll('*')).filter(
          (e) => e.children.length === 0
        );

        container.removeChild(originalClone);

        let hiddenTop = [];
        let cloneTop = null;

        for (let i = leaves.length - 1; i >= 0; i--) {
          const temp = cloneWithHidden(element, hiddenTop);
          const tempHeight = measureHeight(temp);
          if (tempHeight <= maxHeight) {
            cloneTop = temp;
            break;
          }
          hiddenTop.push(i);
        }

        // Remaining (bottom)
        const hiddenBottom = Array.from(
          { length: leaves.length - hiddenTop.length },
          (_, i) => i
        );
        const cloneBottom = cloneWithHidden(element, hiddenBottom);

        return {
          top: cloneTop,
          bottom: cloneBottom,
        };
      }

      for (let i = 0; i < pdfElements.length; i++) {
        const el = pdfElements[i];
        const clone = el.cloneNode(true);
        const height = measureHeight(clone);

        if (height > AVAILABLE_HEIGHT) {
          // Split the element
          const { top, bottom } = splitElement(
            el,
            AVAILABLE_HEIGHT - currentHeight
          );

          if (top) {
            fragments.push([...currentPage, top]);
            currentPage = [];
            currentHeight = 0;
          }

          const bottomHeight = measureHeight(bottom);

          if (bottomHeight > AVAILABLE_HEIGHT) {
            // If bottom still too big, recursively break it in next iterations
            pdfElements.splice(i + 1, 0, bottom);
          } else {
            currentPage.push(bottom);
            currentHeight += bottomHeight;
          }
        } else {
          if (currentHeight + height > AVAILABLE_HEIGHT) {
            // Case: element needs splitting to fit in remaining space on current page
            const availableSpace = AVAILABLE_HEIGHT - currentHeight;

            if (height > availableSpace) {
              // Split the element to fit as much as we can into remaining space
              const { top, bottom } = splitElement(el, availableSpace);

              if (top) {
                currentPage.push(top);
                fragments.push([...currentPage]);
              } else if (currentPage.length > 0) {
                // nothing could fit in current page
                fragments.push([...currentPage]);
              }

              currentPage = [];

              const bottomHeight = measureHeight(bottom);
              if (bottomHeight > AVAILABLE_HEIGHT) {
                // too big again, recursively split later
                pdfElements.splice(i + 1, 0, bottom);
              } else {
                currentPage = [bottom];
                currentHeight = bottomHeight;
              }
            } else {
              // Element fits on a fresh page, so just flush and start new
              if (currentPage.length > 0) {
                fragments.push([...currentPage]);
              }

              currentPage = [el];
              currentHeight = height;
            }
          } else {
            currentPage.push(el);
            currentHeight += height;
          }
        }
      }

      if (currentPage.length > 0) {
        fragments.push([...currentPage]);
      }

      setPages(fragments);
      document.body.removeChild(container);
    }, [pdfRef, headerRef, footerRef, version]);
