package service

import (
	"context"

	"some-handle-stuff/internal/core/domain"
	"some-handle-stuff/internal/core/ports"
)

type TaskService struct {
	repo ports.TaskRepository
	ids  ports.IDGenerator
}

var _ ports.TaskService = (*TaskService)(nil)

func NewTaskService(repo ports.TaskRepository, ids ports.IDGenerator) *TaskService {
	return &TaskService{repo: repo, ids: ids}
}

func (s *TaskService) Create(ctx context.Context, title string) (domain.Task, error) {
	task, err := domain.NewTask(s.ids.NewID(), title)
	if err != nil {
		return domain.Task{}, err
	}
	if err := s.repo.Save(ctx, task); err != nil {
		return domain.Task{}, err
	}
	return task, nil
}

func (s *TaskService) Get(ctx context.Context, id string) (domain.Task, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *TaskService) List(ctx context.Context) ([]domain.Task, error) {
	return s.repo.List(ctx)
}

func (s *TaskService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *TaskService) Complete(ctx context.Context, id string) (domain.Task, error) {
	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return domain.Task{}, err
	}
	task.Done = true
	if err := s.repo.Save(ctx, task); err != nil {
		return domain.Task{}, err
	}
	return task, nil
}
