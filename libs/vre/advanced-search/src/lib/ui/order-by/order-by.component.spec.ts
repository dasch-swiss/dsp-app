import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderByComponent } from './order-by.component';

describe('OrderByComponent', () => {
  let component: OrderByComponent;
  let fixture: ComponentFixture<OrderByComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderByComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderByComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
