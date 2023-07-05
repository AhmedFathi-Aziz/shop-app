const deleteProduct = (button) => {
  const prodId = button.parentNode.querySelector('[name=productId]').value;

  const productElement = button.closest('article');

  // send this url to the current host
  fetch('/admin/product/' + prodId, {
    method: 'DELETE'
  })
  .then(result => {
    return result.json();
  })
  .then(data => {
    console.log(data);
    productElement.parentNode.removeChild(productElement);
  })
  .catch(err => {
    console.log(err);
  })
};