import { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-hot-toast';

interface Booking {
  id: number;
  guestName: string;
  roomNo: string;
  checkIn: string;
  checkOut: string;
  status: string;
  pax: number;
}

export default function Calendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, [currentMonth]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data.filter((b: Booking) => b.status !== 'CANCELLED' && b.status !== 'DELETED'));
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => {
      return dateStr >= b.checkIn && dateStr <= b.checkOut;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">calendar_month</span>
          Room Availability Calendar
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-small" onClick={prevMonth}>
            <span className="material-icons">chevron_left</span>
          </button>
          <span style={{ fontWeight: '600', fontSize: '16px', minWidth: '150px', textAlign: 'center' }}>
            {monthName}
          </span>
          <button className="btn btn-secondary btn-small" onClick={nextMonth}>
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="section-box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              fontWeight: '700',
              textAlign: 'center',
              padding: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase'
            }}>
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Calendar days */}
          {days.map(date => {
            const dayBookings = getBookingsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                style={{
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '8px',
                  minHeight: '100px',
                  background: isToday ? 'rgba(59, 130, 246, 0.1)' : 'white',
                  borderColor: isToday ? 'var(--accent-blue)' : 'var(--glass-border)',
                  borderWidth: isToday ? '2px' : '1px'
                }}
              >
                <div style={{
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  {date.getDate()}
                </div>
                <div style={{ fontSize: '11px' }}>
                  {dayBookings.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      style={{
                        padding: '4px',
                        marginBottom: '2px',
                        background: b.status === 'COLLECTED' ? '#d1fae5' : '#fed7aa',
                        borderRadius: '4px',
                        fontSize: '10px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={`${b.guestName} - ${b.roomNo}`}
                    >
                      {b.roomNo} - {b.guestName.split(' ')[0]}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="section-box">
        <h3 className="section-title">
          <span className="material-icons">info</span>
          Legend
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', background: '#d1fae5', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '13px' }}>Collected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', background: '#fed7aa', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '13px' }}>Pending Payment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid var(--accent-blue)', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '13px' }}>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
