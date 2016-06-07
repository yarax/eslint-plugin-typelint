/**
 * Test transfer data with variables
 * @param man <human>
 */
function test(man) {
  // reassign before using
  man = null;
  var a = man.firstName.a.b.c;
}
/**
 * Test transfer data with variables
 * @param man <human>
 */
function test2(man) {
  var a = man.wrong;
  //reassign after using
  man = null;
}
/**
 * Test transfer data with variables
 * @items {Array}
 */
function test3(items) {
  var a = items.wrong;
  items = null;
  //reassign after using
}