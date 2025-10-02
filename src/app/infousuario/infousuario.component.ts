import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-infousuario',
  templateUrl: './infousuario.component.html'
})
export class InfousuarioComponent implements OnInit {
  formUser: any = {
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    uniId: '',
    role: 'USER',
    lessonSetHas: [],
    reservationSetHash: []
  };

  lessons: any[] = [];
  filteredLessons: any[] = [];
  classrooms: any[] = [];
  selectedLessonId: number | null = null;
  selectedClassroomId: number | null = null;
  userId: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  selectedReservation: any | null = null;
  reservationData: any = { reservationDate: '', startTime: '', endTime: '' };
  isEditMode: boolean = false;
  reservations: any[] = [];

  reservationDate: string = '';
  startTime: string = '';
  endTime: string = '';
  reservationId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params['id'];
      this.loadUserData();
      this.loadLessons();
      this.loadClassrooms();
    });
  }

  convertTo24HourFormat(time: string): string {
    const [hour, minute] = time.split(':');
    const period = time.slice(-2);
    let hours24 = parseInt(hour, 10);

    if (period === 'AM') {
      if (hours24 === 12) {
        hours24 = 0;
      }
    } else if (period === 'PM') {
      if (hours24 !== 12) {
        hours24 += 12;
      }
    }

    return `${hours24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  }

  loadUserData(): void {
    this.apiService.getUserWithLessons(this.userId).subscribe({
      next: (userWithLessons) => {
        this.formUser = userWithLessons;
        this.loadUserReservations();
      },
      error: () => {
        this.errorMessage = 'Error al cargar los datos del usuario';
      }
    });
  }

  loadLessons(): void {
    this.loading = true;
    this.apiService.getAllLessons().subscribe({
      next: (lessons) => {
        this.lessons = lessons.filter(lesson => lesson.subjectLesson);
        this.filteredLessons = [...this.lessons];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar las lecciones';
        this.loading = false;
      }
    });
  }

  loadClassrooms(): void {
    this.loading = true;
    this.apiService.getAllClassrooms().subscribe({
      next: (classrooms) => {
        this.classrooms = classrooms;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar los salones';
        this.loading = false;
      }
    });
  }

  assignLessonToUser(): void {
    if (this.selectedLessonId) {
      this.apiService.assignLessonToUser(this.userId, this.selectedLessonId.toString()).subscribe({
        next: () => {
          this.loadUserData();
        },
        error: () => {
          this.errorMessage = 'Error al asignar la lección al usuario';
        }
      });
    } else {
      this.errorMessage = 'Debes seleccionar una lección antes de asignarla';
    }
  }

  removeLessonFromUser(lessonId: number): void {
    this.apiService.deleteUserLesson(this.userId, lessonId.toString()).subscribe({
      next: () => {
        this.loadUserData();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la relación con la lección';
      }
    });
  }

  loadReservations(): void {
    this.apiService.getAllReservationsWithUsers().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
      }
    });
  }

  onCreateReservation(): void {
    const reservationData = {
      reservationDate: this.reservationData.reservationDate,
      startTime: this.convertTo24HourFormat(this.reservationData.startTime),
      endTime: this.convertTo24HourFormat(this.reservationData.endTime),
      classroomId: this.selectedClassroomId,
    };

    if (!reservationData.classroomId) {
      this.errorMessage = 'Debe seleccionar un salón para la reserva.';
      return;
    }

    this.apiService.createReservation(reservationData).pipe(
      switchMap((response: { id: number }) => {
        if (response && response.id) {
          this.reservationId = response.id;
          if (this.selectedClassroomId) {
            return this.apiService.assignClassroomToReservation(
              this.reservationId,
              this.selectedClassroomId
            );
          } else {
            throw new Error('ID del salón es inválido.');
          }
        } else {
          throw new Error('No se obtuvo el ID de la reserva.');
        }
      })
    ).subscribe({
      next: () => {
        this.loadReservations();
        this.resetForm();
        this.associateReservationToUser();
      },
      error: () => {
        this.errorMessage = 'Error al procesar la solicitud.';
      },
    });
  }

  onUpdateReservation(): void {
    if (this.selectedReservation) {
      const reservationData = {
        ...this.reservationData,
        startTime: this.convertTo24HourFormat(this.reservationData.startTime),
        endTime: this.convertTo24HourFormat(this.reservationData.endTime),
      };

      this.apiService.updateReservation(this.selectedReservation.id, reservationData).subscribe({
        next: () => {
          this.loadReservations();
          this.resetForm();
        },
        error: () => {}
      });
    }
  }

  onSelectReservation(reservation: any): void {
    this.selectedReservation = { ...reservation };
    this.reservationData = {
      reservationDate: reservation.reservationDate,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    };
    this.isEditMode = true;
  }

  resetForm(): void {
    this.reservationData = { reservationDate: '', startTime: '', endTime: '' };
    this.selectedReservation = null;
    this.isEditMode = false;
  }

  assignClassroomToReservation(): void {
    if (!this.reservationId || !this.selectedClassroomId) {
      this.errorMessage = 'Error: No se puede asignar el salón porque falta el ID de la reserva o el salón.';
      return;
    }

    this.apiService.assignClassroomToReservation(this.reservationId, this.selectedClassroomId).subscribe({
      next: () => {},
      error: () => {
        this.errorMessage = 'Error al asignar el salón a la reserva.';
      }
    });
  }

  associateReservationToUser(): void {
    if (this.reservationId) {
      this.apiService.associateReservationToUser(this.userId, this.reservationId).subscribe({
        next: () => {
          this.loadUserData();
        },
        error: () => {
          this.errorMessage = 'Error al asociar la reserva';
        }
      });
    }
  }

  loadUserReservations(): void {
    this.apiService.getAllReservationsWithUsers().subscribe({
      next: (reservations: any[]) => {
        if (this.formUser && this.formUser.uniId) {
          this.formUser.reservationSetHash = reservations.filter((reservation) =>
            reservation.userSetHash.some((user: any) => user.uniId === this.formUser.uniId)
          );
        }
      },
      error: () => {
        this.errorMessage = 'Error al cargar las reservas del usuario';
      }
    });
  }

  onDeleteReservation(reservationId: string): void {
    this.apiService.deleteUserReservation(this.userId, reservationId).subscribe({
      next: () => {
        this.apiService.deleteClassroomFromReservation(reservationId).subscribe({
          next: () => {
            this.apiService.deleteReservation(reservationId).subscribe({
              next: () => {
                this.loadUserData();
              },
              error: () => {
                this.errorMessage = 'Error al eliminar la reserva';
              }
            });
          },
          error: () => {
            this.errorMessage = 'Error al eliminar la relación con el salón';
          }
        });
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la relación entre el usuario y la reserva';
      }
    });
  }
}
