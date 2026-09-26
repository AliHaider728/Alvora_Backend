import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveRoutineOrder, restoreRoutineStock } from '../src/mysql-lib/routineOrders.js';
import { DEFAULT_ROUTINE_DISCOUNT } from '../src/lib/routineDiscount.js';
import { buildOrderConfirmationEmail } from '../src/utils/mailer.js';

function fixture() {
  const stock = new Map(['a', 'b', 'c', 'v'].map(id => [id, 20]));
  const conn = { execute: async (sql: string, args: any[] = []): Promise<any> => {
    if (sql.includes('FROM routine_discount_settings')) return [[{ config: DEFAULT_ROUTINE_DISCOUNT }]];
    if (sql.includes('FROM products WHERE')) return [[{ id: args[0], name: 'Product ' + args[0], price: 1000, stockQuantity: stock.get(args[0]), trackInventory: true, inStock: true, status: 'published', isVisible: true, productType: args[0] === 'v' ? 'variable' : 'simple' }]];
    if (sql.includes('FROM product_variants')) return [[{ id: 'variant', regularPrice: 1000, enabled: true, manageStock: true, stockQuantity: stock.get('v'), attributes: {size:'30 ml'} }]];
    if (sql.startsWith('UPDATE')) { const id = args[1] === 'variant' ? 'v' : args[1]; const old = stock.get(id)!; if (sql.includes(' - ') && old < args[0]) return [{affectedRows:0}]; stock.set(id,old + (sql.includes(' + ') ? args[0] : -args[0])); return [{affectedRows:1}]; }
    throw new Error(sql);
  }};
  return {conn,stock};
}
for (const [quantities,expected] of [[[1,1],1800],[[1,1,1],2550],[[2,1],2550],[[3,1,1],4000],[[1],1000]] as [number[],number][]) {
  test(`routine ${quantities.join('+')} totals ${expected} in one canonical line`, async () => {
    const {conn,stock}=fixture();
    const line=await resolveRoutineOrder(conn,{productId:'routine-test',quantity:1,price:expected,routineComponents:quantities.map((quantity,i)=>({productId:['a','b','c'][i],quantity,unitPrice:1,name:'Untrusted'}))});
    assert.equal(line.price,expected);assert.equal(line.quantity,1);assert.equal(line.routineComponents.length,quantities.length);
    assert.equal(line.routineComponents[0].name,'Product a');assert.equal(line.routineComponents[0].unitPrice,1000);
    assert.equal(stock.get('a'),20-quantities[0]);
    await restoreRoutineStock(conn,{...line,routineComponents:JSON.stringify(line.routineComponents)});
    assert.equal(stock.get('a'),20);
  });
}
test('parent quantity multiplies components, not the per-routine discount tier',async()=>{
  const {conn,stock}=fixture();const line=await resolveRoutineOrder(conn,{productId:'routine-test',quantity:2,price:1800,routineComponents:[{productId:'a',quantity:1},{productId:'b',quantity:1}]});
  assert.equal(line.price*line.quantity,3600);assert.equal(stock.get('a'),18);
});
test('variants reserve and restore the selected variant inventory',async()=>{
  const {conn,stock}=fixture();const line=await resolveRoutineOrder(conn,{productId:'routine-test',quantity:1,price:2550,routineComponents:[{productId:'v',variationId:'variant',quantity:2},{productId:'b',quantity:1}]});
  assert.equal(stock.get('v'),18);assert.equal(line.routineComponents[0].selectedVariant,'size: 30 ml');await restoreRoutineStock(conn,line);assert.equal(stock.get('v'),20);
});
test('reject price tampering, duplicate components and unavailable stock',async()=>{
  for(const routineComponents of [[{productId:'a',quantity:1},{productId:'a',quantity:1}],[{productId:'a',quantity:21}],[{productId:'a',quantity:1}]]) {
    await assert.rejects(resolveRoutineOrder(fixture().conn,{productId:'routine-test',quantity:1,price:1,routineComponents}));
  }
});
test('confirmation email includes component names and quantities under the routine',async()=>{
  const line=await resolveRoutineOrder(fixture().conn,{productId:'routine-test',quantity:1,price:1800,routineComponents:[{productId:'a',quantity:1},{productId:'b',quantity:1}]});
  const content=buildOrderConfirmationEmail({orderId:'QA',items:[{...line,name:line.productName}],shippingAddress:{}});
  assert.match(content.html,/Includes: 1 x Product a; 1 x Product b/);assert.match(content.text,/Includes: 1 x Product a; 1 x Product b/);
});
