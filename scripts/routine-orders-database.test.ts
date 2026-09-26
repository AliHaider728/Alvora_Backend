import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {pool} from '../src/mysql-lib/db.js';
import {resolveRoutineOrder,readRoutineComponents,restoreRoutineStock} from '../src/mysql-lib/routineOrders.js';
import {getRoutineSettings} from '../src/mysql-lib/routineSettings.js';
import {calculateRoutineDiscount} from '../src/lib/routineDiscount.js';
import {resolveCartLine} from '../src/lib/pricingOffers.js';

async function main(){const conn=await pool.getConnection();try{
 await conn.beginTransaction();
 const [rows]:any=await conn.execute("SELECT id,name,price,pricingOffers,stockQuantity,trackInventory FROM products WHERE productType = 'simple' AND status = 'published' AND isVisible = 1 AND inStock = 1 AND (trackInventory = 0 OR stockQuantity >= 2) ORDER BY id LIMIT 2 FOR UPDATE");
 assert.equal(rows.length,2);
 const components=rows.map((p:any,i:number)=>({productId:p.id,name:p.name,quantity:i===0?2:1,unitPrice:resolveCartLine(typeof p.pricingOffers==='string'?JSON.parse(p.pricingOffers):p.pricingOffers,Number(p.price),i===0?2:1).unitPrice}));
 const totals=calculateRoutineDiscount(components,await getRoutineSettings(conn));
 const line=await resolveRoutineOrder(conn,{productId:'routine-'+crypto.randomUUID(),quantity:1,price:totals.total,routineComponents:components});
 const id=crypto.randomBytes(12).toString('hex');const orderId='QA-ROUTINE-'+id;
 await conn.execute("INSERT INTO orders (id,orderId,guestPhone,total,subtotal,shippingFee,discountAmount,status,paymentMethod,shippingAddress,createdAt,updatedAt) VALUES (?,?,?,?,?,0,0,'Pending','COD','{}',NOW(),NOW())",[id,orderId,'03000000000',line.price,line.price]);
 await conn.execute('INSERT INTO order_items (id,order_id,productId,productName,quantity,price,image,selectedVariant,variationId,routineComponents) VALUES (?,?,?,?,?,?,?,?,?,?)',[crypto.randomBytes(12).toString('hex'),id,line.productId,line.productName,line.quantity,line.price,null,null,null,JSON.stringify(line.routineComponents)]);
 const [saved]:any=await conn.execute('SELECT productId,quantity,price,routineComponents FROM order_items WHERE order_id = ?',[id]);
 assert.equal(saved.length,1);assert.equal(Number(saved[0].price),totals.total);assert.deepEqual(readRoutineComponents(saved[0].routineComponents).map((c:any)=>c.quantity),[2,1]);
 await restoreRoutineStock(conn,saved[0]);
 for(const p of rows){const [stock]:any=await conn.execute('SELECT stockQuantity FROM products WHERE id = ?',[p.id]);assert.equal(Number(stock[0].stockQuantity),Number(p.stockQuantity));}
 await conn.rollback();
 const [check]:any=await conn.execute('SELECT id FROM orders WHERE id = ?',[id]);assert.equal(check.length,0);
 console.log('PASS real MySQL: one parent order item, component JSON round-trip, authoritative pricing, stock restoration. Entire test transaction rolled back; no order/emails created.');
}finally{await conn.rollback();conn.release();await pool.end();}}
main().catch(e=>{console.error(e.message);process.exitCode=1});
